// Base de test de charge : comptes et données fictifs.
// Usage : DATABASE_URL="file:/chemin/loadtest.db" node loadtest/seed.cjs [nbSportifs]
const path = require("path");
const root = path.join(__dirname, "..");
const bcrypt = require(path.join(root, "api/node_modules/bcrypt"));
const { PrismaClient } = require(path.join(root, "api/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const NB_SPORTIFS = Number(process.argv[2]) || 400;
const NB_COACHS = 4;
const MOT_DE_PASSE = "charge1234";
const MUSCLES = ["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Avant-bras", "Abdominaux", "Fessiers", "Quadriceps", "Ischio-jambiers", "Mollets"];
const DAY = 24 * 60 * 60 * 1000;

const EXERCICES = [
  { exercice: "Squat", series: 4, nbRep: 10, lest: 50, tempsDeRepos: 45, muscles: ["Quadriceps", "Fessiers"] },
  { exercice: "Pompes", series: 3, nbRep: 12, tempsDeRepos: 30, muscles: ["Pectoraux", "Triceps"] },
  { exercice: "Rowing haltère", series: 3, nbRep: 10, lest: 18, tempsDeRepos: 30, muscles: ["Dos", "Biceps"] },
  { exercice: "Gainage", series: 2, duree: 45, tempsDeRepos: 20, muscles: ["Abdominaux"] },
];

async function main() {
  for (const nom of MUSCLES) await prisma.muscle.upsert({ where: { nom }, update: {}, create: { nom } });
  const muscleId = Object.fromEntries((await prisma.muscle.findMany()).map((m) => [m.nom, m.id]));
  const hash = await bcrypt.hash(MOT_DE_PASSE, 10);
  const cgu = new Date();

  const coachs = [];
  for (let c = 1; c <= NB_COACHS; c++) {
    coachs.push(await prisma.profil.create({
      data: { nom: `Coach${c}`, prenom: "Test", mail: `coach${c}@charge.local`, motDePasse: hash, role: "COACH", cguAccepteesLe: cgu },
    }));
  }

  for (let s = 1; s <= NB_SPORTIFS; s++) {
    const coach = coachs[s % NB_COACHS];
    const sportif = await prisma.profil.create({
      data: { nom: `Sportif${s}`, prenom: "Test", mail: `sportif${s}@charge.local`, motDePasse: hash, role: "USER", cguAccepteesLe: cgu },
    });
    await prisma.coachSubscription.create({ data: { coachId: coach.id, athleteId: sportif.id, status: "ACTIVE" } });

    // 6 séances passées (réalisées et notées) + 1 séance du jour.
    for (let k = -6; k <= 0; k++) {
      const circuit = await prisma.circuit.create({
        data: {
          nom: k === 0 ? "Séance du jour" : `Séance ${k + 7}`,
          type: "FORCE",
          date: new Date(Date.now() + k * 7 * DAY),
          auteurId: coach.id,
          personnes: { create: [{ profilId: sportif.id }] },
          exercices: {
            create: EXERCICES.map(({ muscles, ...ex }, ordre) => ({
              ...ex,
              ordre,
              muscles: { create: muscles.map((n) => ({ muscleId: muscleId[n] })) },
            })),
          },
        },
        include: { exercices: true },
      });
      if (k < 0) {
        const series = circuit.exercices.flatMap((ex) =>
          Array.from({ length: ex.series || 1 }, (_, i) => ({ exerciceId: ex.id, serie: i + 1, reps: ex.nbRep, lest: ex.lest, duree: ex.duree }))
        );
        await prisma.realisation.create({ data: { circuitId: circuit.id, profilId: sportif.id, series: { create: series } } });
        await prisma.exerciceNote.createMany({
          data: circuit.exercices.map((ex) => ({ exerciceId: ex.id, profilId: sportif.id, note: 6 + ((s + k) % 5) })),
        });
      }
    }
    if (s % 100 === 0) console.log(`${s}/${NB_SPORTIFS} sportifs`);
  }
  console.log(`seed ok : ${NB_COACHS} coachs, ${NB_SPORTIFS} sportifs`);
}

main().finally(() => prisma.$disconnect());
