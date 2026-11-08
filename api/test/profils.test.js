const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, createUser, api, createCircuit, prisma } = require("./helpers");

before(start);
after(stop);

let counter = 0;
const nouveauSportif = () => {
  counter += 1;
  return { nom: "Créé", prenom: "Sportif", mail: `cree-${counter}@test.local`, motDePasse: "motdepasse123" };
};

// Sportif inscrit lui-même, puis abonné au coach.
async function coachAndSelfRegistered() {
  const coach = await createUser("COACH");
  const athlete = await createUser("USER");
  await prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: athlete.id } });
  return { coach, athlete };
}

describe("droits d'un coach sur le profil d'un sportif", () => {
  it("sportif inscrit lui-même : suivi physique seulement", async () => {
    const { coach, athlete } = await coachAndSelfRegistered();

    const physique = await api("PUT", `/profils/${athlete.id}`, { token: coach.token, body: { poids: 72, blessures: "genou" } });
    assert.equal(physique.status, 200);
    assert.equal(physique.body.poids, 72);

    for (const body of [{ mail: "vol@test.local" }, { motDePasse: "nouveaumdp123" }, { nom: "Autre" }]) {
      const res = await api("PUT", `/profils/${athlete.id}`, { token: coach.token, body });
      assert.equal(res.status, 403, JSON.stringify(body));
      assert.equal(res.body.code, "FIELD_FORBIDDEN");
    }

    const suppression = await api("DELETE", `/profils/${athlete.id}`, { token: coach.token });
    assert.equal(suppression.status, 403);
    assert.ok(await prisma.profil.findUnique({ where: { id: athlete.id } }));
  });

  it("compte créé par le coach : droits complets", async () => {
    const coach = await createUser("COACH");
    const created = await api("POST", "/profils", { token: coach.token, body: nouveauSportif() });
    assert.equal(created.status, 201);
    assert.equal(created.body.creeParId, coach.id);

    const maj = await api("PUT", `/profils/${created.body.id}`, {
      token: coach.token,
      body: { mail: `change-${counter}@test.local`, motDePasse: "autremdp1234" },
    });
    assert.equal(maj.status, 200);

    const suppression = await api("DELETE", `/profils/${created.body.id}`, { token: coach.token });
    assert.equal(suppression.status, 204);
  });

  it("le créateur perd ses droits si le sportif s'est désabonné", async () => {
    const coach = await createUser("COACH");
    const { body } = await api("POST", "/profils", { token: coach.token, body: nouveauSportif() });
    await prisma.coachSubscription.update({
      where: { coachId_athleteId: { coachId: coach.id, athleteId: body.id } },
      data: { status: "CANCELLED" },
    });
    const res = await api("DELETE", `/profils/${body.id}`, { token: coach.token });
    assert.equal(res.status, 403);
  });

  it("un autre coach n'a aucun droit sur un compte créé par un coach", async () => {
    const createur = await createUser("COACH");
    const autre = await createUser("COACH");
    const { body } = await api("POST", "/profils", { token: createur.token, body: nouveauSportif() });
    await prisma.coachSubscription.create({ data: { coachId: autre.id, athleteId: body.id } });

    const res = await api("PUT", `/profils/${body.id}`, { token: autre.token, body: { motDePasse: "piratage123" } });
    assert.equal(res.status, 403);
  });
});

describe("retirer un sportif de ses abonnés", () => {
  it("annule l'abonnement sans supprimer le compte", async () => {
    const { coach, athlete } = await coachAndSelfRegistered();
    const res = await api("DELETE", `/me/subscribers/${athlete.id}`, { token: coach.token });
    assert.equal(res.status, 204);

    const sub = await prisma.coachSubscription.findUnique({ where: { coachId_athleteId: { coachId: coach.id, athleteId: athlete.id } } });
    assert.equal(sub.status, "CANCELLED");
    assert.ok(await prisma.profil.findUnique({ where: { id: athlete.id } }));

    const encore = await api("DELETE", `/me/subscribers/${athlete.id}`, { token: coach.token });
    assert.equal(encore.status, 404);
  });

  it("fonctionne aussi pour un sportif dont le coach a créé le compte", async () => {
    const coach = await createUser("COACH");
    const cree = await api("POST", "/profils", { token: coach.token, body: nouveauSportif() });
    assert.equal(cree.status, 201);

    const res = await api("DELETE", `/me/subscribers/${cree.body.id}`, { token: coach.token });
    assert.equal(res.status, 204);
    assert.ok(await prisma.profil.findUnique({ where: { id: cree.body.id } }));

    const liste = await api("GET", "/me/subscribers", { token: coach.token });
    assert.ok(!liste.body.some((s) => s.id === cree.body.id));
  });

  it("est réservé au staff", async () => {
    const athlete = await createUser("USER");
    const res = await api("DELETE", `/me/subscribers/1`, { token: athlete.token });
    assert.equal(res.status, 403);
  });
});

describe("création de compte par un utilisateur connecté", () => {
  it("un sportif connecté ne peut pas créer de compte", async () => {
    const athlete = await createUser("USER");
    const res = await api("POST", "/profils", { token: athlete.token, body: nouveauSportif() });
    assert.equal(res.status, 403);
  });

  it("un admin choisit le rôle du compte créé, puis peut le changer", async () => {
    const admin = await createUser("ADMIN");
    const res = await api("POST", "/profils", { token: admin.token, body: { ...nouveauSportif(), role: "ADMIN" } });
    assert.equal(res.status, 201);
    assert.equal(res.body.role, "ADMIN");

    const maj = await api("PUT", `/profils/${res.body.id}`, { token: admin.token, body: { role: "COACH" } });
    assert.equal(maj.status, 200);
    assert.equal(maj.body.role, "COACH");
  });

  it("un coach ne crée pas de compte admin et ne change pas de rôle", async () => {
    const coach = await createUser("COACH");
    const res = await api("POST", "/profils", { token: coach.token, body: { ...nouveauSportif(), role: "ADMIN" } });
    assert.equal(res.status, 403);

    const cree = await api("POST", "/profils", { token: coach.token, body: nouveauSportif() });
    assert.equal(cree.status, 201);
    const maj = await api("PUT", `/profils/${cree.body.id}`, { token: coach.token, body: { role: "COACH" } });
    assert.equal(maj.status, 403);
  });
});

describe("acceptation des CGU", () => {
  it("un compte créé par un coach n'a pas accepté les CGU, puis les accepte", async () => {
    const coach = await createUser("COACH");
    const { body: cree } = await api("POST", "/profils", { token: coach.token, body: nouveauSportif() });
    assert.equal(cree.cguAccepteesLe, null);

    const athlete = await prisma.profil.findUnique({ where: { id: cree.id } });
    const { signToken } = require("../src/lib/token");
    const res = await api("POST", "/me/cgu", { token: signToken(athlete.id) });
    assert.equal(res.status, 200);
    assert.ok(res.body.cguAccepteesLe);
  });

  it("exige une session", async () => {
    const res = await api("POST", "/me/cgu");
    assert.equal(res.status, 401);
  });
});

describe("suppression d'un coach", () => {
  it("les séances sont conservées pour les sportifs", async () => {
    const { coach, athlete } = await coachAndSelfRegistered();
    const circuit = await createCircuit(coach, [athlete.id]);
    const admin = await createUser("ADMIN");

    assert.equal((await api("DELETE", `/profils/${coach.id}`, { token: admin.token })).status, 204);

    const restante = await prisma.circuit.findUnique({ where: { id: circuit.id } });
    assert.ok(restante);
    assert.equal(restante.auteurId, null);

    const vue = await api("GET", `/circuits/${circuit.id}`, { token: athlete.token });
    assert.equal(vue.status, 200);
    assert.equal(vue.body.auteur, null);

    // Enregistrer sa réalisation ne tente plus de prévenir un coach inexistant.
    const real = await api("PUT", `/circuits/${circuit.id}/realisation`, { token: athlete.token, body: { series: [] } });
    assert.equal(real.status, 200);
  });
});

describe("paramètres invalides", () => {
  it("répondent 400 au lieu de 500", async () => {
    const coach = await createUser("COACH");
    const cas = [
      ["GET", "/circuits/abc"],
      ["GET", "/circuits?from=pas-une-date"],
      ["GET", "/circuits?profilId=abc"],
      ["GET", "/profils/abc"],
      ["GET", "/exercices/abc"],
      ["GET", "/templates/abc"],
      ["GET", "/coaches/abc"],
    ];
    for (const [method, url] of cas) {
      const res = await api(method, url, { token: coach.token });
      assert.equal(res.status, 400, `${method} ${url} → ${res.status}`);
    }
    const muscle = await api("POST", "/muscles", { token: coach.token, body: { nom: {} } });
    assert.equal(muscle.status, 400);
  });
});
