const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { assertCanViewProfil } = require("../lib/profilAccess");
const { defaultMuscles } = require("../lib/exerciceCatalogue");

// Statistiques d'entraînement d'un profil (soi-même, ou un sportif lié au coach).

const DAY_MS = 24 * 60 * 60 * 1000;

async function targetProfilId(req) {
  const profilId = req.query.profilId ? Number(req.query.profilId) : req.user.id;
  if (!Number.isInteger(profilId) || profilId <= 0) throw new HttpError(400, "profilId invalide", "VALIDATION_ERROR");
  await assertCanViewProfil(req.user, profilId);
  return profilId;
}

function parseDay(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, "Date invalide", "VALIDATION_ERROR");
  return d;
}

// GET /api/stats/muscles?profilId=&from=&to= — séries et volume (kg × reps) par
// groupe musculaire sur la période (7 derniers jours par défaut). Une séance
// saisie dans le lecteur compte ses séries réelles ; sinon, une séance passée
// compte les séries prévues.
async function muscles(req, res) {
  const profilId = await targetProfilId(req);
  const now = new Date();
  const to = parseDay(req.query.to, now);
  const from = parseDay(req.query.from, new Date(to.getTime() - 6 * DAY_MS));
  const end = new Date(Math.min(new Date(to.toDateString()).getTime() + DAY_MS, now.getTime() + DAY_MS));

  const [allMuscles, circuits] = await Promise.all([
    prisma.muscle.findMany({ orderBy: { nom: "asc" } }),
    prisma.circuit.findMany({
      where: { date: { gte: new Date(from.toDateString()), lt: end }, personnes: { some: { profilId } } },
      select: {
        exercices: {
          select: {
            id: true,
            exercice: true,
            series: true,
            nbRep: true,
            lest: true,
            muscles: { select: { muscle: { select: { nom: true } } } },
          },
        },
        realisations: { where: { profilId }, select: { series: true } },
      },
    }),
  ]);

  const totals = new Map(allMuscles.map((m) => [m.nom, { nom: m.nom, series: 0, volume: 0 }]));
  for (const circuit of circuits) {
    const realisees = circuit.realisations[0]?.series;
    for (const ex of circuit.exercices) {
      const nomsMuscles = ex.muscles.length ? ex.muscles.map((m) => m.muscle.nom) : defaultMuscles(ex.exercice);
      let series;
      let volume;
      if (realisees) {
        const faites = realisees.filter((s) => s.exerciceId === ex.id);
        series = faites.length;
        volume = faites.reduce((sum, s) => sum + (s.reps ?? 0) * (s.lest ?? 0), 0);
      } else {
        series = ex.series > 0 ? ex.series : 1;
        volume = series * (ex.nbRep ?? 0) * (ex.lest ?? 0);
      }
      for (const nom of nomsMuscles) {
        const t = totals.get(nom);
        if (!t) continue;
        t.series += series;
        t.volume += volume;
      }
    }
  }

  res.json({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), muscles: [...totals.values()] });
}

// GET /api/stats/exercices?profilId= — progression réelle par exercice, à
// partir des séries saisies : charge max, reps max et volume de chaque séance,
// plus les records.
async function exercices(req, res) {
  const profilId = await targetProfilId(req);
  const realisations = await prisma.realisation.findMany({
    where: { profilId },
    select: {
      circuit: { select: { id: true, date: true } },
      series: { select: { reps: true, lest: true, exercice: { select: { exercice: true } } } },
    },
  });

  const byName = new Map();
  for (const r of realisations) {
    const parExercice = new Map();
    for (const s of r.series) {
      const nom = s.exercice.exercice.trim();
      const key = nom.toLowerCase();
      if (!parExercice.has(key)) parExercice.set(key, { nom, series: [] });
      parExercice.get(key).series.push(s);
    }
    for (const [key, { nom, series }] of parExercice) {
      if (!byName.has(key)) byName.set(key, { exercice: nom, points: [] });
      byName.get(key).points.push({
        date: r.circuit.date.toISOString().slice(0, 10),
        circuitId: r.circuit.id,
        chargeMax: Math.max(0, ...series.map((s) => s.lest ?? 0)),
        repsMax: Math.max(0, ...series.map((s) => s.reps ?? 0)),
        volume: series.reduce((sum, s) => sum + (s.reps ?? 0) * (s.lest ?? 0), 0),
        series: series.length,
      });
    }
  }

  const result = [...byName.values()].map((e) => {
    const points = e.points.sort((a, b) => a.date.localeCompare(b.date));
    return {
      ...e,
      points,
      record: {
        chargeMax: Math.max(...points.map((p) => p.chargeMax)),
        repsMax: Math.max(...points.map((p) => p.repsMax)),
      },
    };
  });
  res.json(result.sort((a, b) => b.points.length - a.points.length || a.exercice.localeCompare(b.exercice, "fr")));
}

module.exports = { muscles, exercices };
