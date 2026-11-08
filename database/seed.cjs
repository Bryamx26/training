// Seed de départ : muscles + comptes de test.
// Idempotent : peut être exécuté à chaque démarrage du conteneur sans dupliquer les données.
// Exécuter depuis /api : npm run db:seed

const path = require("path");
const bcrypt = require(path.join(__dirname, "../api/node_modules/bcrypt"));
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

// Lea est abonnée au coach de test. `update: {}` : un désabonnement fait
// depuis l'app n'est pas annulé au redémarrage suivant.
async function seedDemoSubscription(admin, sportif) {
  await prisma.coachSubscription.upsert({
    where: { coachId_athleteId: { coachId: admin.id, athleteId: sportif.id } },
    update: {},
    create: { coachId: admin.id, athleteId: sportif.id, status: "ACTIVE" },
  });
  console.log("✔ Abonnement de démo (Lea -> Coach)");
}

// Compte administrateur défini par ADMIN_EMAIL / ADMIN_PASSWORD (dev et prod).
// - Le compte existe déjà : il est promu ADMIN (sa demande coach en attente est
//   close). Son mot de passe n'est jamais modifié, ADMIN_PASSWORD est ignoré.
// - Il n'existe pas : il est créé avec ADMIN_PASSWORD (8 caractères minimum).
// Le mot de passe changé depuis l'app n'est donc pas écrasé au redémarrage :
// une fois le compte créé, ADMIN_PASSWORD peut être retiré du .env.
async function seedAdmin() {
  const mail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!mail) {
    const hasAdmin = await prisma.profil.count({ where: { role: "ADMIN" } });
    if (!hasAdmin) console.warn("⚠ Aucun compte admin : définis ADMIN_EMAIL (et ADMIN_PASSWORD) dans .env");
    return;
  }

  const existing = await prisma.profil.findUnique({ where: { mail } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.profil.update({ where: { id: existing.id }, data: { role: "ADMIN", demandeCoach: false } });
      console.log(`✔ Compte ${mail} promu ADMIN`);
    }
    return;
  }

  const motDePasse = process.env.ADMIN_PASSWORD ?? "";
  if (motDePasse.length < 8) {
    console.warn(`⚠ Admin ${mail} non créé : ADMIN_PASSWORD doit faire 8 caractères minimum`);
    return;
  }
  await prisma.profil.create({
    data: { nom: "Admin", prenom: "Admin", mail, role: "ADMIN", motDePasse: await bcrypt.hash(motDePasse, 10) },
  });
  console.log(`✔ Compte admin ${mail} créé`);
}

async function main() {
  await seedMuscles();
  await seedAdmin();
  // Pas de comptes de test (mots de passe connus) sur une base de production.
  if (process.env.NODE_ENV === "production") return;
  const { admin, sportif } = await seedTestUsers();
  await seedDemoSubscription(admin, sportif);
  await seedDemoCircuit(admin, sportif);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
