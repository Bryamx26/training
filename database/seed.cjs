// Seed de départ : muscles + comptes de test.
// Idempotent : peut être exécuté à chaque démarrage du conteneur sans dupliquer les données.
// Exécuter depuis /api : npm run db:seed

const path = require("path");
const bcrypt = require(path.join(__dirname, "../api/node_modules/bcryptjs"));
const { PrismaClient } = require(path.join(__dirname, "../api/node_modules/@prisma/client"));

const prisma = new PrismaClient();

const muscles = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Avant-bras",
  "Abdominaux",
  "Fessiers",
  "Quadriceps",
  "Ischio-jambiers",
  "Mollets",
];

async function seedMuscles() {
  for (const nom of muscles) {
    await prisma.muscle.upsert({ where: { nom }, update: {}, create: { nom } });
  }
  console.log(`✔ ${muscles.length} muscles`);
}

async function upsertProfil({ nom, prenom, mail, motDePasse, role, poids, taille, age }) {
  const hashed = await bcrypt.hash(motDePasse, 10);
  return prisma.profil.upsert({
    where: { mail },
    update: {},
    create: { nom, prenom, mail, motDePasse: hashed, role, poids, taille, age },
  });
}

async function seedTestUsers() {
  const admin = await upsertProfil({
    nom: "Martin",
    prenom: "Coach",
    mail: "coach@test.com",
    motDePasse: "coach123",
    role: "ADMIN",
  });

  const sportif = await upsertProfil({
    nom: "Marchand",
    prenom: "Lea",
    mail: "lea@test.com",
    motDePasse: "lea123",
    role: "USER",
    poids: 60,
    taille: 168,
    age: 27,
  });

  console.log("✔ Comptes de test :");
  console.log("   admin   -> coach@test.com / coach123");
  console.log("   sportif -> lea@test.com / lea123");

  return { admin, sportif };
}

async function seedDemoCircuit(admin, sportif) {
  const existing = await prisma.circuit.findFirst({ where: { auteurId: admin.id } });
  if (existing) return;

  const circuit = await prisma.circuit.create({
    data: {
      nom: "Renforcement",
      type: "FORCE",
      niveau: "Intermédiaire",
      date: new Date(),
      auteurId: admin.id,
      personnes: { create: [{ profilId: sportif.id }] },
      exercices: {
        create: [
          {
            exercice: "Squat",
            objectif: "Renforcer les jambes",
            consignes: "Dos droit, amplitude complète.",
            series: 4,
            nbRep: 12,
            tempsDeRepos: 60,
            ordre: 0,
          },
          {
            exercice: "Gainage",
            objectif: "Stabilité du tronc",
            duree: 60,
            ordre: 1,
          },
        ],
      },
    },
    include: { exercices: true },
  });

  const [squat, gainage] = circuit.exercices;
  await prisma.exerciceNote.create({
    data: { exerciceId: squat.id, profilId: sportif.id, note: 8, commentaire: "Bonne posture." },
  });
  await prisma.exerciceNote.create({
    data: { exerciceId: gainage.id, profilId: sportif.id, note: 10, commentaire: "Excellent travail." },
  });
  console.log("✔ Séance de démo créée (Renforcement)");
}

async function main() {
  await seedMuscles();
  const { admin, sportif } = await seedTestUsers();
  await seedDemoCircuit(admin, sportif);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
