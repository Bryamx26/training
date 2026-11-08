const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, createUser, api, prisma } = require("./helpers");

before(start);
after(stop);

// Appel HTTP brut, pour lire les en-têtes (cookie de session).
function raw(method, url, { body, cookie } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  return fetch(`${process.env.TEST_API_URL}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

const register = (body) => api("POST", "/profils", { body: { nom: "Test", prenom: "Jo", motDePasse: "motdepasse", accepteCgu: true, ...body } });

describe("session par cookie httpOnly", () => {
  it("la connexion pose un cookie httpOnly et ne renvoie pas le jeton", async () => {
    await register({ mail: "Cookie@Test.local" });

    const res = await raw("POST", "/auth/login", { body: { mail: "cookie@test.local", motDePasse: "motdepasse" } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.token, undefined, "le jeton n'est pas exposé au JavaScript");
    assert.equal(body.profil.mail, "cookie@test.local", "adresse enregistrée en minuscules");
    assert.equal(body.profil.motDePasse, undefined);

    const setCookie = res.headers.get("set-cookie");
    assert.match(setCookie, /^session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);

    const cookie = setCookie.split(";")[0];
    const me = await raw("GET", "/auth/me", { cookie });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).profil.mail, "cookie@test.local");

    const logout = await raw("POST", "/auth/logout", { cookie });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get("set-cookie"), /session=;/);
  });

  it("un cookie invalide renvoie 401 sur une route protégée, mais pas sur l'inscription", async () => {
    const me = await raw("GET", "/auth/me", { cookie: "session=faux" });
    assert.equal(me.status, 401);
    assert.equal((await me.json()).code, "SESSION_EXPIRED");

    const res = await raw("POST", "/profils", {
      cookie: "session=faux",
      body: { nom: "A", prenom: "B", mail: "vieux-cookie@test.local", motDePasse: "motdepasse", accepteCgu: true },
    });
    assert.equal(res.status, 201);
  });

  it("identifiants invalides : même réponse que le compte existe ou non", async () => {
    await register({ mail: "existe@test.local" });
    const wrongPassword = await api("POST", "/auth/login", { body: { mail: "existe@test.local", motDePasse: "mauvais!" } });
    const unknown = await api("POST", "/auth/login", { body: { mail: "inconnu@test.local", motDePasse: "mauvais!" } });
    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(wrongPassword.body, unknown.body);
  });

  it("la connexion Google refuse quand le serveur n'est pas configuré", async () => {
    const res = await api("POST", "/auth/google", { body: { credential: "x" } });
    assert.equal(res.status, 500);
    assert.equal(res.body.code, "GOOGLE_NOT_CONFIGURED");
  });
});

describe("inscription et validation", () => {
  it("valide les champs du profil", async () => {
    const invalides = [
      { mail: "pas-une-adresse" },
      { mail: "court@test.local", motDePasse: "court" },
      { mail: "age@test.local", age: -3 },
      { mail: "poids@test.local", poids: "lourd" },
      { mail: "role@test.local", role: "SUPERHEROS" },
      { mail: "vide@test.local", prenom: "  " },
    ];
    for (const body of invalides) {
      const res = await register(body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.code, "VALIDATION_ERROR");
    }
  });

  it("une adresse déjà utilisée renvoie 409 MAIL_TAKEN", async () => {
    await register({ mail: "double@test.local" });
    const res = await register({ mail: "DOUBLE@test.local" });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "MAIL_TAKEN");
  });

  it("une inscription publique ne peut pas créer d'admin", async () => {
    const res = await register({ mail: "admin-pirate@test.local", role: "ADMIN" });
    assert.equal(res.status, 403);
  });

  it("une inscription coach crée un sportif avec une demande, validée par un admin", async () => {
    const admin = await createUser("ADMIN");
    const res = await register({ mail: "futur-coach@test.local", role: "COACH" });
    assert.equal(res.status, 201);
    assert.equal(res.body.role, "USER");
    assert.equal(res.body.demandeCoach, true);

    const notif = await prisma.notification.findFirst({ where: { profilId: admin.id, type: "DEMANDE_COACH" } });
    assert.ok(notif, "les admins sont prévenus");

    const pending = await api("GET", "/profils?demandeCoach=true", { token: admin.token });
    assert.ok(pending.body.some((p) => p.id === res.body.id));

    // Le candidat ne peut pas se valider lui-même.
    const candidat = { ...res.body, token: require("../src/lib/token").signToken(res.body.id) };
    const self = await api("PUT", `/profils/${candidat.id}`, { token: candidat.token, body: { role: "COACH" } });
    assert.equal(self.status, 403);

    const approved = await api("PUT", `/profils/${candidat.id}`, { token: admin.token, body: { role: "COACH" } });
    assert.equal(approved.status, 200);
    assert.equal(approved.body.role, "COACH");
    assert.equal(approved.body.demandeCoach, false);
  });

  it("un coach connecté crée un sportif, jamais un coach", async () => {
    const coach = await createUser("COACH");
    const res = await api("POST", "/profils", {
      token: coach.token,
      body: { nom: "N", prenom: "P", mail: "cree-par-coach@test.local", motDePasse: "motdepasse", role: "COACH" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.role, "USER");
    assert.equal(res.body.demandeCoach, false);
  });

  it("un JSON mal formé renvoie 400", async () => {
    const res = await fetch(`${process.env.TEST_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{pas du json",
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, "INVALID_JSON");
  });
});

describe("en-têtes de sécurité", () => {
  it("helmet est actif et aucune origine externe n'est autorisée", async () => {
    const res = await fetch(`${process.env.TEST_API_URL}/auth/me`, { headers: { Origin: "https://pirate.example" } });
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});

describe("RGPD", () => {
  it("une inscription publique exige l'acceptation des CGU et en garde la date", async () => {
    const refus = await register({ mail: "sans-cgu@test.local", accepteCgu: undefined });
    assert.equal(refus.status, 400);
    assert.equal(refus.body.code, "CGU_REQUIRED");

    const ok = await register({ mail: "avec-cgu@test.local" });
    assert.equal(ok.status, 201);
    assert.ok(ok.body.cguAccepteesLe, "date d'acceptation enregistrée");
  });

  it("exporte les données du compte connecté, sans le mot de passe", async () => {
    const user = await createUser("USER");
    const res = await fetch(`${process.env.TEST_API_URL}/me/export`, { headers: { Authorization: `Bearer ${user.token}` } });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-disposition"), /attachment/);
    const body = await res.json();
    assert.equal(body.profil.id, user.id);
    assert.equal(body.profil.motDePasse, undefined);
    assert.ok(Array.isArray(body.realisations));

    assert.equal((await api("GET", "/me/export")).status, 401);
  });

  it("un utilisateur peut supprimer son propre compte", async () => {
    const user = await createUser("USER");
    assert.equal((await api("DELETE", `/profils/${user.id}`, { token: user.token })).status, 204);
    assert.equal(await prisma.profil.findUnique({ where: { id: user.id } }), null);
  });
});
