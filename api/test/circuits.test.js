const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, createUser, api, createCircuit, prisma } = require("./helpers");

before(start);
after(stop);

// Coach + sportif abonné.
async function coachAndAthlete() {
  const coach = await createUser("COACH");
  const athlete = await createUser("USER");
  await prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: athlete.id } });
  return { coach, athlete };
}

const notificationsOf = (user) => api("GET", "/me/notifications", { token: user.token });

describe("création et validation des séances", () => {
  it("valide le corps d'une séance", async () => {
    const coach = await createUser("COACH");
    const invalides = [
      { type: "FORCE", date: "2026-10-10" },
      { nom: "S", type: "YOGA", date: "2026-10-10" },
      { nom: "S", type: "FORCE", date: "pas une date" },
      { nom: "S", type: "FORCE", date: "2026-10-10", note: 12 },
      { nom: "S", type: "FORCE", date: "2026-10-10", exercices: [{ exercice: "" }] },
      { nom: "S", type: "FORCE", date: "2026-10-10", repetition: { semaines: 0 } },
    ];
    for (const body of invalides) {
      const res = await api("POST", "/circuits", { token: coach.token, body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.code, "VALIDATION_ERROR");
    }
  });

  it("une séance récurrente crée une occurrence par semaine", async () => {
    const { coach, athlete } = await coachAndAthlete();
    const res = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "Hebdo", type: "FORCE", date: "2026-11-02", participantIds: [athlete.id], repetition: { semaines: 4 }, exercices: [{ exercice: "Squat", series: 3 }] },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.occurrenceIds.length, 4);

    const occurrences = await prisma.circuit.findMany({
      where: { id: { in: res.body.occurrenceIds } },
      include: { exercices: true, personnes: true },
      orderBy: { date: "asc" },
    });
    assert.deepEqual(
      occurrences.map((c) => c.date.toISOString().slice(0, 10)),
      ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]
    );
    assert.ok(occurrences.every((c) => c.exercices.length === 1 && c.personnes[0].profilId === athlete.id));

    // Une seule notification regroupée pour le sportif.
    const notifs = (await notificationsOf(athlete)).body;
    assert.equal(notifs.nonLues, 1);
    assert.match(notifs.notifications[0].message, /4 nouvelles séances/);
  });

  it("filtre les séances par période", async () => {
    const coach = await createUser("COACH");
    for (const date of ["2026-01-05", "2026-01-11", "2026-01-12"]) {
      await prisma.circuit.create({ data: { nom: date, type: "FORCE", date: new Date(date), auteurId: coach.id } });
    }
    const res = await api("GET", "/circuits?from=2026-01-05&to=2026-01-11", { token: coach.token });
    assert.deepEqual(res.body.map((c) => c.nom).sort(), ["2026-01-05", "2026-01-11"]);
  });

  it("enregistre les muscles travaillés d'un exercice", async () => {
    const coach = await createUser("COACH");
    const [dos, biceps] = await Promise.all(["Dos", "Biceps"].map((nom) => prisma.muscle.upsert({ where: { nom }, update: {}, create: { nom } })));
    const res = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "Tirage", type: "FORCE", date: "2026-10-10", exercices: [{ exercice: "Tractions", muscleIds: [dos.id, biceps.id] }] },
    });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.exercices[0].muscles.map((m) => m.muscle.nom).sort(), ["Biceps", "Dos"]);

    const exId = res.body.exercices[0].id;
    const updated = await api("PUT", `/exercices/${exId}`, { token: coach.token, body: { muscleIds: [dos.id] } });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.muscles.map((m) => m.nom), ["Dos"]);
    assert.equal(updated.body.exercice, "Tractions", "une modification partielle garde les autres champs");
  });
});

describe("notes et notifications", () => {
  it("noter un sportif le prévient une seule fois tant qu'il n'a pas lu", async () => {
    const { coach, athlete } = await coachAndAthlete();
    const created = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "Notée", type: "FORCE", date: "2026-10-10", participantIds: [athlete.id], exercices: [{ exercice: "Squat" }, { exercice: "Pompes" }] },
    });
    await api("POST", "/me/notifications/read", { token: athlete.token, body: {} });

    for (const ex of created.body.exercices) {
      const res = await api("PUT", `/exercices/${ex.id}/notes/${athlete.id}`, { token: coach.token, body: { note: 7 } });
      assert.equal(res.status, 200);
    }
    const notifs = (await notificationsOf(athlete)).body;
    assert.equal(notifs.nonLues, 1);
    assert.equal(notifs.notifications[0].type, "SEANCE_NOTEE");
    assert.equal(notifs.notifications[0].lien, `/seances/${created.body.id}`);

    // Marquer comme lu ne touche que ses propres notifications.
    const coachNotif = await prisma.notification.create({ data: { profilId: coach.id, type: "T", message: "m" } });
    await api("POST", "/me/notifications/read", { token: athlete.token, body: { ids: [coachNotif.id] } });
    assert.equal((await prisma.notification.findUnique({ where: { id: coachNotif.id } })).lu, false);
    await api("POST", "/me/notifications/read", { token: athlete.token, body: {} });
    assert.equal((await notificationsOf(athlete)).body.nonLues, 0);
  });

  it("refuse une note hors limites ou pour un non-participant", async () => {
    const { coach, athlete } = await coachAndAthlete();
    const created = await api("POST", "/circuits", {
      token: coach.token,
      body: { nom: "S", type: "FORCE", date: "2026-10-10", exercices: [{ exercice: "Squat" }] },
    });
    const exId = created.body.exercices[0].id;
    assert.equal((await api("PUT", `/exercices/${exId}/notes/${athlete.id}`, { token: coach.token, body: { note: 7 } })).status, 400);
    await api("PUT", `/circuits/${created.body.id}/participants`, { token: coach.token, body: { participantIds: [athlete.id] } });
    assert.equal((await api("PUT", `/exercices/${exId}/notes/${athlete.id}`, { token: coach.token, body: { note: 11 } })).status, 400);
  });

  it("un abonnement prévient le coach", async () => {
    const coach = await createUser("COACH");
    const athlete = await createUser("USER", "Nina");
    await api("POST", `/coaches/${coach.id}/subscribe`, { token: athlete.token });
    const notifs = (await notificationsOf(coach)).body;
    assert.equal(notifs.notifications[0].type, "NOUVEL_ABONNE");
    assert.match(notifs.notifications[0].message, /Nina/);
  });
});

describe("réalisation d'une séance", () => {
  async function setup() {
    const { coach, athlete } = await coachAndAthlete();
    const other = await createUser("USER");
    await prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: other.id } });
    const created = await api("POST", "/circuits", {
      token: coach.token,
      body: {
        nom: "Force",
        type: "FORCE",
        date: new Date().toISOString().slice(0, 10),
        participantIds: [athlete.id, other.id],
        exercices: [
          { exercice: "Squat", series: 2, nbRep: 10, lest: 40 },
          { exercice: "Gainage", duree: 30 },
        ],
      },
    });
    const [squat, gainage] = created.body.exercices;
    return { coach, athlete, other, circuit: created.body, squat, gainage };
  }

  it("le participant enregistre ses séries ; le coach est prévenu", async () => {
    const { coach, athlete, other, circuit, squat, gainage } = await setup();
    const body = {
      series: [
        { exerciceId: squat.id, serie: 1, reps: 10, lest: 40 },
        { exerciceId: squat.id, serie: 2, reps: 8, lest: 45 },
        { exerciceId: gainage.id, serie: 1, duree: 30 },
      ],
    };
    const res = await api("PUT", `/circuits/${circuit.id}/realisation`, { token: athlete.token, body });
    assert.equal(res.status, 200);
    assert.equal(res.body.series.length, 3);

    // Relancer remplace la saisie, sans doublon ni nouvelle notification.
    const again = await api("PUT", `/circuits/${circuit.id}/realisation`, { token: athlete.token, body: { ...body, series: body.series.slice(0, 2) } });
    assert.equal(again.body.series.length, 2);
    assert.equal(await prisma.serieRealisee.count({ where: { realisation: { circuitId: circuit.id } } }), 2);
    const coachNotifs = (await notificationsOf(coach)).body.notifications.filter((n) => n.type === "SEANCE_REALISEE");
    assert.equal(coachNotifs.length, 1);

    // Le coach voit toutes les réalisations, un sportif seulement la sienne.
    await api("PUT", `/circuits/${circuit.id}/realisation`, { token: other.token, body: { series: [] } });
    assert.equal((await api("GET", `/circuits/${circuit.id}`, { token: coach.token })).body.realisations.length, 2);
    const seen = (await api("GET", `/circuits/${circuit.id}`, { token: athlete.token })).body.realisations;
    assert.deepEqual(seen.map((r) => r.profilId), [athlete.id]);
  });

  it("un participant ne peut pas noter la séance", async () => {
    const { athlete, circuit, squat } = await setup();
    const res = await api("PUT", `/exercices/${squat.id}/notes/${athlete.id}`, { token: athlete.token, body: { note: 10 } });
    assert.equal(res.status, 403);
    // Une ancienne version du lecteur envoyait un ressenti : il est ignoré.
    const saved = await api("PUT", `/circuits/${circuit.id}/realisation`, { token: athlete.token, body: { rpe: 9, series: [] } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.rpe, undefined);
  });

  it("refuse un non-participant ou un exercice d'une autre séance", async () => {
    const { coach, athlete, circuit, squat } = await setup();
    const outsider = await createUser("USER");
    const byOutsider = await api("PUT", `/circuits/${circuit.id}/realisation`, { token: outsider.token, body: { series: [] } });
    assert.equal(byOutsider.status, 403);
    assert.equal(byOutsider.body.code, "NOT_A_PARTICIPANT");

    const otherCircuit = await createCircuit(coach, [athlete.id]);
    const otherEx = await prisma.exercice.create({ data: { exercice: "X", circuitId: otherCircuit.id } });
    const foreign = await api("PUT", `/circuits/${circuit.id}/realisation`, {
      token: athlete.token,
      body: { series: [{ exerciceId: otherEx.id, serie: 1 }] },
    });
    assert.equal(foreign.status, 400);
    assert.ok(squat);
  });

  it("statistiques : volume par muscle et progression par exercice", async () => {
    const { coach, athlete, other, circuit, squat } = await setup();
    for (const nom of ["Quadriceps", "Fessiers", "Abdominaux"]) await prisma.muscle.upsert({ where: { nom }, update: {}, create: { nom } });
    await api("PUT", `/circuits/${circuit.id}/realisation`, {
      token: athlete.token,
      body: { series: [{ exerciceId: squat.id, serie: 1, reps: 10, lest: 40 }, { exerciceId: squat.id, serie: 2, reps: 8, lest: 50 }] },
    });

    const muscles = await api("GET", `/stats/muscles?profilId=${athlete.id}`, { token: coach.token });
    assert.equal(muscles.status, 200);
    const quadri = muscles.body.muscles.find((m) => m.nom === "Quadriceps");
    assert.equal(quadri.series, 2, "séries réalisées");
    assert.equal(quadri.volume, 10 * 40 + 8 * 50);
    assert.equal(muscles.body.muscles.find((m) => m.nom === "Abdominaux").series, 0, "gainage non réalisé");

    // Sans saisie, les séries prévues d'une séance passée comptent.
    const planned = (await api("GET", "/stats/muscles", { token: other.token })).body.muscles;
    assert.equal(planned.find((m) => m.nom === "Quadriceps").series, 2);
    assert.equal(planned.find((m) => m.nom === "Abdominaux").series, 1);

    const progression = await api("GET", "/stats/exercices", { token: athlete.token });
    assert.equal(progression.status, 200);
    const squatStats = progression.body.find((e) => e.exercice === "Squat");
    assert.deepEqual(squatStats.record, { chargeMax: 50, repsMax: 10 });
    assert.equal(squatStats.points[0].volume, 800);

    // Un sportif ne consulte pas les stats d'un autre.
    assert.equal((await api("GET", `/stats/muscles?profilId=${athlete.id}`, { token: other.token })).status, 403);
  });
});

describe("pagination de la liste des séances", () => {
  // 7 séances d'un coach, une par jour, la plus récente aujourd'hui + 3 jours.
  async function coachWithCircuits() {
    const coach = await createUser("COACH");
    const DAY = 24 * 60 * 60 * 1000;
    for (let i = 0; i < 7; i++) {
      await prisma.circuit.create({
        data: {
          nom: i === 2 ? "Cardio du mardi" : `Séance ${i}`,
          type: "FORCE",
          date: new Date(Date.now() + (3 - i) * DAY),
          auteurId: coach.id,
          exercices: { create: [{ exercice: i === 4 ? "Burpees" : "Squat", ordre: 0 }] },
        },
      });
    }
    return coach;
  }

  it("sans limit, renvoie toujours la liste complète (tableau)", async () => {
    const coach = await coachWithCircuits();
    const res = await api("GET", "/circuits", { token: coach.token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 7);
  });

  it("parcourt toutes les séances page par page, sans doublon, de la plus récente à la plus ancienne", async () => {
    const coach = await coachWithCircuits();
    const seen = [];
    let cursor = null;
    let pages = 0;
    do {
      const res = await api("GET", `/circuits?limit=3${cursor ? `&cursor=${cursor}` : ""}`, { token: coach.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 7);
      assert.ok(res.body.items.length <= 3);
      seen.push(...res.body.items);
      cursor = res.body.nextCursor;
      pages++;
    } while (cursor && pages < 10);
    assert.equal(pages, 3);
    assert.equal(new Set(seen.map((c) => c.id)).size, 7);
    const dates = seen.map((c) => new Date(c.date).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  });

  it("filtre côté serveur : recherche, à venir, terminées", async () => {
    const coach = await coachWithCircuits();
    const now = new Date().toISOString();
    const parNom = await api("GET", "/circuits?limit=10&q=cardio", { token: coach.token });
    assert.deepEqual(parNom.body.items.map((c) => c.nom), ["Cardio du mardi"]);
    const parExercice = await api("GET", "/circuits?limit=10&q=burpees", { token: coach.token });
    assert.equal(parExercice.body.total, 1);
    const aVenir = await api("GET", `/circuits?limit=10&from=${now}`, { token: coach.token });
    const terminees = await api("GET", `/circuits?limit=10&before=${now}`, { token: coach.token });
    assert.equal(aVenir.body.total + terminees.body.total, 7);
    assert.ok(aVenir.body.items.every((c) => new Date(c.date) >= new Date(now)));
    assert.ok(terminees.body.items.every((c) => new Date(c.date) < new Date(now)));
  });

  it("refuse une limite ou un curseur invalide", async () => {
    const coach = await createUser("COACH");
    for (const qs of ["limit=0", "limit=abc", "limit=5&cursor=x", "limit=5&before=pas-une-date"]) {
      const res = await api("GET", `/circuits?${qs}`, { token: coach.token });
      assert.equal(res.status, 400, qs);
    }
  });

  it("plafonne la taille d'une page", async () => {
    const coach = await coachWithCircuits();
    const res = await api("GET", "/circuits?limit=100000", { token: coach.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 7);
  });
});

describe("synthèse du tableau de bord (GET /circuits/resume)", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const minuit = () => new Date(new Date().toDateString());

  // Séances passées et à venir, notées en entier, en partie ou pas du tout,
  // dont une où le coach participe et se note lui-même.
  async function scenario() {
    const { coach, athlete } = await coachAndAthlete();
    const other = await createUser("USER");
    await prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: other.id } });
    const make = async (days, participants, notes) => {
      const c = await prisma.circuit.create({
        data: {
          nom: `J${days}`,
          type: "FORCE",
          date: new Date(minuit().getTime() + days * DAY + 10 * 3600 * 1000),
          auteurId: coach.id,
          personnes: { create: participants.map((p) => ({ profilId: p.id })) },
          exercices: { create: [{ exercice: "Squat", ordre: 0 }, { exercice: "Pompes", ordre: 1 }] },
        },
        include: { exercices: true },
      });
      for (const [profil, values] of notes) {
        for (const [i, note] of values.entries()) {
          if (note !== undefined) await prisma.exerciceNote.create({ data: { exerciceId: c.exercices[i].id, profilId: profil.id, note } });
        }
      }
      return c;
    };
    await make(-10, [athlete, other], [[athlete, [8, 6]], [other, [10, 9]]]); // deux sportifs notés en entier
    await make(-5, [athlete], [[athlete, [7, undefined]]]); // notée en partie : ignorée
    await make(-2, [athlete, coach], [[athlete, [5, 5]], [coach, [10, 10]]]); // le coach se note : exclu
    await make(1, [other], []);
    await make(3, [athlete], []);
    await make(6, [athlete], []);
    await make(9, [other], []);
    return { coach, athlete };
  }

  it("renvoie les mêmes chiffres que le calcul du front sur la liste complète", async () => {
    const { coach } = await scenario();
    const { computeScoreForProfil } = await import("../../src/lib/score.js");
    const depuis = minuit().toISOString();

    const all = (await api("GET", "/circuits", { token: coach.token })).body;
    const gradees = all
      .flatMap((c) => c.personnes.filter((p) => p.profilId !== coach.id).map((p) => computeScoreForProfil(c.exercices, p.profilId)))
      .filter((s) => s.graded);
    const attendu = Math.round(gradees.reduce((s, g) => s + g.percentage, 0) / gradees.length);

    const res = await api("GET", `/circuits/resume?depuis=${depuis}`, { token: coach.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.seancesCreees, all.length);
    assert.equal(res.body.aVenir, all.filter((c) => new Date(c.date) >= new Date(depuis)).length);
    assert.equal(res.body.progressionMoyenne, attendu);
    // Notées en entier : 14/20 = 70 %, 19/20 = 95 %, 10/20 = 50 % → (70 + 95 + 50) / 3 = 71,7 → 72.
    assert.equal(res.body.progressionMoyenne, 72);
  });

  it("donne les 3 prochaines séances, de la plus proche à la plus lointaine", async () => {
    const { coach } = await scenario();
    const res = await api("GET", `/circuits/resume?depuis=${minuit().toISOString()}`, { token: coach.token });
    assert.deepEqual(res.body.prochaines.map((c) => c.nom), ["J1", "J3", "J6"]);
    assert.ok(res.body.prochaines[0].exercices && res.body.prochaines[0].personnes);
  });

  it("ne compte que les séances du coach, et refuse les sportifs", async () => {
    const { coach, athlete } = await scenario();
    const autre = await createUser("COACH");
    const vide = await api("GET", "/circuits/resume", { token: autre.token });
    assert.deepEqual([vide.body.seancesCreees, vide.body.aVenir, vide.body.progressionMoyenne, vide.body.prochaines.length], [0, 0, 0, 0]);
    assert.equal((await api("GET", "/circuits/resume", { token: athlete.token })).status, 403);
    assert.equal((await api("GET", "/circuits/resume?depuis=xx", { token: coach.token })).status, 400);
    assert.ok(coach);
  });
});
