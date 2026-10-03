const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, createUser, api, createCircuit, prisma } = require("./helpers");

before(start);
after(stop);

const subscribe = (athlete, coach) => api("POST", `/coaches/${coach.id}/subscribe`, { token: athlete.token });
const unsubscribe = (athlete, coach) =>
  api("PATCH", `/coaches/${coach.id}/subscribe`, { token: athlete.token, body: { status: "cancelled" } });

describe("abonnement d'un sportif à un coach", () => {
  it("1. un sportif peut s'abonner à un coach", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER");

    const res = await subscribe(athlete, coach);
    assert.equal(res.status, 201);
    assert.equal(res.body.status, "ACTIVE");

    const mine = await api("GET", "/me/coaches", { token: athlete.token });
    assert.deepEqual(mine.body.map((c) => c.id), [coach.id]);
  });

  it("2. un sportif ne peut pas s'abonner à un utilisateur qui n'est pas coach", async () => {
    const athlete = await createUser("USER");
    const other = await createUser("USER");

    const notCoach = await subscribe(athlete, other);
    assert.equal(notCoach.status, 400);
    assert.equal(notCoach.body.code, "NOT_A_COACH");

    const missing = await subscribe(athlete, { id: 999999 });
    assert.equal(missing.status, 404);
    assert.equal(missing.body.code, "COACH_NOT_FOUND");
  });

  it("3. un sportif peut se désabonner, puis se réabonner sans doublon", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER");
    await subscribe(athlete, coach);

    const res = await unsubscribe(athlete, coach);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "CANCELLED");
    assert.deepEqual((await api("GET", "/me/coaches", { token: athlete.token })).body, []);

    const again = await unsubscribe(athlete, coach);
    assert.equal(again.status, 404);
    assert.equal(again.body.code, "SUBSCRIPTION_NOT_FOUND");

    const back = await subscribe(athlete, coach);
    assert.equal(back.status, 200, "une relation annulée est réactivée");
    assert.equal(await prisma.coachSubscription.count({ where: { coachId: coach.id, athleteId: athlete.id } }), 1);
  });

  it("8. deux abonnements identiques ne peuvent pas être créés", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER");
    await subscribe(athlete, coach);

    const dup = await subscribe(athlete, coach);
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, "ALREADY_SUBSCRIBED");

    // La contrainte unique (coachId, athleteId) protège aussi la base elle-même.
    await assert.rejects(
      prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: athlete.id } }),
      (err) => err.code === "P2002"
    );
  });

  it("9. un utilisateur ne peut pas modifier les abonnements d'un autre", async () => {
    const coach = await createUser("COACH");
    const alice = await createUser("USER", "alice");
    const bob = await createUser("USER", "bob");
    await subscribe(alice, coach);

    // Bob tente d'annuler : la route n'agit que sur SON abonnement, qui n'existe pas.
    const res = await unsubscribe(bob, coach);
    assert.equal(res.status, 404);
    const alices = await prisma.coachSubscription.findUnique({
      where: { coachId_athleteId: { coachId: coach.id, athleteId: alice.id } },
    });
    assert.equal(alices.status, "ACTIVE");

    // Un coach ne peut pas s'abonner (ni abonner quelqu'un) à un autre coach.
    const otherCoach = await createUser("COACH");
    const byCoach = await subscribe(coach, otherCoach);
    assert.equal(byCoach.status, 403);
    assert.equal(byCoach.body.code, "ONLY_ATHLETES");
  });

  it("la recherche ne renvoie que des coachs, avec l'état d'abonnement", async () => {
    const coach = await createUser("COACH", "Zorro");
    await createUser("USER", "Zorrette");
    const athlete = await createUser("USER");
    await subscribe(athlete, coach);

    const res = await api("GET", "/coaches?search=Zorr", { token: athlete.token });
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.map((c) => [c.prenom, c.subscribed]),
      [["Zorro", true]]
    );
    assert.equal(res.body[0].mail, undefined, "le mail d'un coach n'est pas exposé");
  });
});

describe("abonnés d'un coach et séances", () => {
  it("4. un coach voit uniquement ses abonnés actifs", async () => {
    const coach = await createUser("COACH");
    const otherCoach = await createUser("COACH");
    const active = await createUser("USER", "actif");
    const cancelled = await createUser("USER", "parti");
    const elsewhere = await createUser("USER", "ailleurs");
    await subscribe(active, coach);
    await subscribe(cancelled, coach);
    await unsubscribe(cancelled, coach);
    await subscribe(elsewhere, otherCoach);

    const res = await api("GET", "/me/subscribers", { token: coach.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((p) => p.id), [active.id]);
  });

  it("5. un coach peut ajouter un abonné à une séance", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER");
    await subscribe(athlete, coach);

    const created = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "S", type: "FORCE", date: "2026-10-10", participantIds: [athlete.id] },
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.personnes.map((p) => p.profilId), [athlete.id]);

    const circuit = await createCircuit(coach);
    const added = await api("POST", `/circuits/${circuit.id}/participants`, {
      token: coach.token,
      body: { profilId: athlete.id },
    });
    assert.equal(added.status, 201);
  });

  it("6. un coach ne peut pas ajouter un non-abonné (création, ajout, remplacement)", async () => {
    const coach = await createUser("COACH");
    const stranger = await createUser("USER");
    const circuit = await createCircuit(coach);

    const attempts = [
      api("POST", "/circuits", {
        token: coach.token,
        body: { nom: "S", type: "FORCE", date: "2026-10-10", participantIds: [stranger.id] },
      }),
      api("POST", `/circuits/${circuit.id}/participants`, { token: coach.token, body: { profilId: stranger.id } }),
      api("PUT", `/circuits/${circuit.id}/participants`, { token: coach.token, body: { participantIds: [stranger.id] } }),
    ];
    for (const res of await Promise.all(attempts)) {
      assert.equal(res.status, 403);
      assert.equal(res.body.code, "ATHLETE_NOT_SUBSCRIBED");
    }
    assert.equal(await prisma.circuitParticipant.count({ where: { profilId: stranger.id } }), 0);
  });

  it("7. une ancienne participation reste présente après désabonnement", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER");
    await subscribe(athlete, coach);
    const circuit = await createCircuit(coach, [athlete.id]);

    await unsubscribe(athlete, coach);

    const seen = await api("GET", `/circuits/${circuit.id}`, { token: athlete.token });
    assert.equal(seen.status, 200, "le sportif voit toujours la séance passée");
    assert.deepEqual(seen.body.personnes.map((p) => p.profilId), [athlete.id]);

    // Le coach peut réenregistrer la séance en gardant cet ancien participant…
    const kept = await api("PUT", `/circuits/${circuit.id}/participants`, {
      token: coach.token,
      body: { participantIds: [athlete.id] },
    });
    assert.equal(kept.status, 200);
    // …et consulter encore sa fiche (historique), sans pouvoir la modifier.
    assert.equal((await api("GET", `/profils/${athlete.id}`, { token: coach.token })).status, 200);
    assert.equal((await api("PUT", `/profils/${athlete.id}`, { token: coach.token, body: { poids: 1 } })).status, 403);
  });

  it("10. les permissions sont vérifiées côté backend", async () => {
    const coach = await createUser("COACH");
    const otherCoach = await createUser("COACH");
    const athlete = await createUser("USER");
    await subscribe(athlete, otherCoach);
    const circuit = await createCircuit(coach);

    const noToken = await api("GET", "/me/coaches");
    assert.equal(noToken.status, 401);
    assert.equal(noToken.body.code, "UNAUTHENTICATED");

    const athleteSubscribers = await api("GET", "/me/subscribers", { token: athlete.token });
    assert.equal(athleteSubscribers.status, 403);

    // Un coach ne gère pas la séance d'un autre, même avec un sportif abonné à lui.
    const foreign = await api("POST", `/circuits/${circuit.id}/participants`, {
      token: otherCoach.token,
      body: { profilId: athlete.id },
    });
    assert.equal(foreign.status, 403);
    assert.equal(foreign.body.code, "FORBIDDEN");

    // La liste de tous les comptes est réservée à l'admin.
    assert.equal((await api("GET", "/profils", { token: coach.token })).status, 403);
    // Un coach ne consulte pas un sportif qui ne lui est pas lié.
    assert.equal((await api("GET", `/profils/${athlete.id}`, { token: coach.token })).status, 403);
  });
});

describe("le coach participe à ses propres séances", () => {
  it("un coach peut s'ajouter à sa séance, se noter et retrouver ses statistiques", async () => {
    const coach = await createUser("COACH");

    const created = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "S", type: "FORCE", date: "2026-10-10", participantIds: [coach.id], exercices: [{ exercice: "Squat" }] },
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.personnes.map((p) => p.profilId), [coach.id]);

    const circuit = await createCircuit(coach);
    const added = await api("POST", `/circuits/${circuit.id}/participants`, { token: coach.token, body: { profilId: coach.id } });
    assert.equal(added.status, 201);

    const exerciceId = created.body.exercices[0].id;
    const graded = await api("PUT", `/exercices/${exerciceId}/notes/${coach.id}`, { token: coach.token, body: { note: 8 } });
    assert.equal(graded.status, 200);

    // Ses statistiques personnelles reposent sur les séances où il participe.
    const mine = await api("GET", `/circuits?profilId=${coach.id}`, { token: coach.token });
    assert.deepEqual(mine.body.map((c) => c.id).sort(), [created.body.id, circuit.id].sort());
    assert.equal(mine.body.find((c) => c.id === created.body.id).exercices[0].notes[0].note, 8);
  });

  it("un coach ne peut pas ajouter un autre coach à sa séance", async () => {
    const coach = await createUser("COACH");
    const other = await createUser("COACH");
    const circuit = await createCircuit(coach);
    const res = await api("POST", `/circuits/${circuit.id}/participants`, { token: coach.token, body: { profilId: other.id } });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ATHLETE_NOT_SUBSCRIBED");
  });
});
