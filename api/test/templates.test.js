const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, createUser, api, prisma } = require("./helpers");

before(start);
after(stop);

const sample = (overrides = {}) => ({
  nom: "Full body",
  niveau: "Débutant",
  type: "FORCE",
  exercices: [
    { exercice: "Squat", series: 3, nbRep: 12, tempsDeRepos: 60 },
    { exercice: "Mon exercice maison", duree: 45 },
  ],
  ...overrides,
});

describe("templates de séance", () => {
  it("un coach crée un template, coach_id tiré du jeton et sans participants", async () => {
    const coach = await createUser("COACH");
    const other = await createUser("COACH");

    const res = await api("POST", "/templates", { token: coach.token, body: { ...sample(), coachId: other.id, participantIds: [1] } });
    assert.equal(res.status, 201);
    assert.equal(res.body.coachId, coach.id, "le coachId envoyé par le client est ignoré");
    assert.equal(res.body.personnes, undefined);
    assert.deepEqual(
      res.body.exercices.map((e) => [e.exercice, e.series, e.duree, e.ordre]),
      [
        ["Squat", 3, null, 0],
        ["Mon exercice maison", null, 45, 1],
      ]
    );
  });

  it("accepte une difficulté personnalisée en texte libre", async () => {
    const coach = await createUser("COACH");
    const res = await api("POST", "/templates", { token: coach.token, body: sample({ niveau: "Retour de blessure" }) });
    assert.equal(res.status, 201);
    assert.equal(res.body.niveau, "Retour de blessure");
  });

  it("valide le contenu", async () => {
    const coach = await createUser("COACH");
    const invalides = [
      sample({ nom: "  " }),
      sample({ exercices: [] }),
      sample({ exercices: [{ exercice: "" }] }),
      sample({ type: "YOGA" }),
      sample({ exercices: [{ exercice: "Squat", series: -1 }] }),
    ];
    for (const body of invalides) {
      const res = await api("POST", "/templates", { token: coach.token, body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.code, "VALIDATION_ERROR");
    }
  });

  it("un coach ne voit, ne modifie et ne supprime que ses propres templates", async () => {
    const alice = await createUser("COACH", "alice");
    const bob = await createUser("COACH", "bob");
    const mine = (await api("POST", "/templates", { token: alice.token, body: sample({ nom: "A" }) })).body;
    await api("POST", "/templates", { token: bob.token, body: sample({ nom: "B" }) });

    const list = await api("GET", "/templates", { token: alice.token });
    assert.deepEqual(list.body.map((t) => [t.nom, t.exercicesCount]), [["A", 2]]);

    for (const [method, body] of [["GET"], ["PUT", sample({ nom: "volé" })], ["DELETE"]]) {
      const res = await api(method, `/templates/${mine.id}`, { token: bob.token, body });
      assert.equal(res.status, 404, method);
      assert.equal(res.body.code, "TEMPLATE_NOT_FOUND");
    }
    const intact = await prisma.circuitTemplate.findUnique({ where: { id: mine.id } });
    assert.equal(intact.nom, "A");
  });

  it("les templates sont réservés aux coachs authentifiés", async () => {
    const athlete = await createUser("USER");
    assert.equal((await api("GET", "/templates")).status, 401);
    assert.equal((await api("GET", "/templates", { token: athlete.token })).status, 403);
    assert.equal((await api("POST", "/templates", { token: athlete.token, body: sample() })).status, 403);
  });

  it("modifier un template remplace son contenu sans toucher aux séances déjà créées", async () => {
    const coach = await createUser("COACH");
    const template = (await api("POST", "/templates", { token: coach.token, body: sample() })).body;

    // Séance créée à partir du template : le front en copie le contenu.
    const circuit = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: template.nom, type: template.type, niveau: template.niveau, date: "2026-10-10", exercices: template.exercices },
    });
    assert.equal(circuit.status, 201);

    const updated = await api("PUT", `/templates/${template.id}`, {
      token: coach.token,
      body: sample({ nom: "Full body v2", niveau: "Avancé", exercices: [{ exercice: "Burpees", nbRep: 20 }] }),
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.exercices.map((e) => e.exercice), ["Burpees"]);
    assert.equal(await prisma.templateExercice.count({ where: { templateId: template.id } }), 1);

    const unchanged = await api("GET", `/circuits/${circuit.body.id}`, { token: coach.token });
    assert.equal(unchanged.body.niveau, "Débutant");
    assert.deepEqual(unchanged.body.exercices.map((e) => e.exercice), ["Squat", "Mon exercice maison"]);
  });

  it("supprime un template du coach", async () => {
    const coach = await createUser("COACH");
    const template = (await api("POST", "/templates", { token: coach.token, body: sample() })).body;
    assert.equal((await api("DELETE", `/templates/${template.id}`, { token: coach.token })).status, 204);
    assert.equal((await api("GET", `/templates/${template.id}`, { token: coach.token })).status, 404);
    assert.equal(await prisma.templateExercice.count({ where: { templateId: template.id } }), 0);
  });

  it("le catalogue mêle exercices de base et exercices du coach, sans ceux des autres", async () => {
    const coach = await createUser("COACH");
    const other = await createUser("COACH");
    await api("POST", "/templates", { token: coach.token, body: sample() });
    await api("POST", "/templates", { token: other.token, body: sample({ exercices: [{ exercice: "Secret de Bob" }] }) });

    const res = await api("GET", "/exercices/catalogue", { token: coach.token });
    assert.equal(res.status, 200);
    const names = res.body.map((e) => e.exercice);
    assert.ok(names.includes("Pompes"), "catalogue de base");
    assert.ok(names.includes("Mon exercice maison"), "exercice personnalisé du coach");
    assert.ok(!names.includes("Secret de Bob"), "pas les exercices d'un autre coach");
    assert.equal(res.body.find((e) => e.exercice === "Squat").series, 3, "derniers paramètres utilisés");
  });

  it("la documentation OpenAPI est servie", async () => {
    const res = await fetch(`${process.env.TEST_API_URL}/openapi.yaml`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /^openapi: 3/);
    assert.match(text, /\/templates\/\{id\}:/);
  });
});
