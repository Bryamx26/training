const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { isAdmin } = require("../lib/permissions");
const { findManageableCircuit } = require("../lib/circuitAccess");
const { BASE_CATALOGUE } = require("../lib/exerciceCatalogue");

const INCLUDE = { muscles: { include: { muscle: true } }, notes: true };

// Charge un exercice et vérifie que l'utilisateur connecté gère sa séance.
async function findManageableExercice(user, exerciceId) {
  const exercice = await prisma.exercice.findUnique({ where: { id: Number(exerciceId) }, select: { circuitId: true } });
  if (!exercice) throw new HttpError(404, "Exercice introuvable", "EXERCICE_NOT_FOUND");
  await findManageableCircuit(user, exercice.circuitId);
}

function serialize(exercice) {
  return { ...exercice, muscles: exercice.muscles.map((m) => m.muscle) };
}

// Sans circuitId, la liste de tous les exercices est réservée à un admin.
async function list(req, res) {
  if (req.query.circuitId) await findManageableCircuit(req.user, req.query.circuitId);
  else if (!isAdmin(req.user)) throw new HttpError(400, "circuitId est requis", "CIRCUIT_REQUIRED");

  const where = req.query.circuitId ? { circuitId: Number(req.query.circuitId) } : undefined;
  const exercices = await prisma.exercice.findMany({
    where,
    include: INCLUDE,
    orderBy: { ordre: "asc" },
  });
  res.json(exercices.map(serialize));
}

async function getById(req, res) {
  await findManageableExercice(req.user, req.params.id);
  const exercice = await prisma.exercice.findUnique({
    where: { id: Number(req.params.id) },
    include: INCLUDE,
  });
  if (!exercice) return res.status(404).json({ error: "Exercice introuvable" });
  res.json(serialize(exercice));
}

async function create(req, res) {
  const {
    exercice,
    description,
    consignes,
    objectif,
    series,
    nbRep,
    duree,
    tempsDeRepos,
    tempo,
    lest,
    amplitude,
    url,
    ordre,
    circuitId,
    muscleIds,
  } = req.body;

  if (!exercice || !circuitId) {
    return res.status(400).json({ error: "exercice et circuitId sont requis" });
  }
  await findManageableCircuit(req.user, circuitId);

  const created = await prisma.exercice.create({
    data: {
      exercice,
      description,
      consignes,
      objectif,
      series,
      nbRep,
      duree,
      tempsDeRepos,
      tempo,
      lest,
      amplitude,
      url,
      ordre: ordre ?? 0,
      circuitId: Number(circuitId),
      muscles: muscleIds
        ? { create: muscleIds.map((muscleId) => ({ muscleId: Number(muscleId) })) }
        : undefined,
    },
    include: INCLUDE,
  });
  res.status(201).json(serialize(created));
}

async function update(req, res) {
  const {
    exercice,
    description,
    consignes,
    objectif,
    series,
    nbRep,
    duree,
    tempsDeRepos,
    tempo,
    lest,
    amplitude,
    url,
    ordre,
  } = req.body;
  await findManageableExercice(req.user, req.params.id);

  const updated = await prisma.exercice.update({
    where: { id: Number(req.params.id) },
    data: {
      exercice,
      description,
      consignes,
      objectif,
      series,
      nbRep,
      duree,
      tempsDeRepos,
      tempo,
      lest,
      amplitude,
      url,
      ordre,
    },
    include: INCLUDE,
  });
  res.json(serialize(updated));
}

async function remove(req, res) {
  await findManageableExercice(req.user, req.params.id);
  await prisma.exercice.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

// Note d'un exercice pour un participant précis : chaque sportif d'une séance
// de groupe est noté indépendamment des autres.
async function grade(req, res) {
  const exerciceId = Number(req.params.id);
  const profilId = Number(req.params.profilId);
  const { note, commentaire } = req.body;
  await findManageableExercice(req.user, exerciceId);

  const noteEntry = await prisma.exerciceNote.upsert({
    where: { exerciceId_profilId: { exerciceId, profilId } },
    update: { note, commentaire },
    create: { exerciceId, profilId, note, commentaire },
  });
  res.json(noteEntry);
}

// GET /api/exercices/catalogue — exercices proposés au coach dans le formulaire :
// le catalogue de base, plus ceux qu'il a déjà utilisés dans SES séances et
// SES templates (avec les derniers paramètres saisis, pour pré-remplir).
async function catalogue(req, res) {
  const fields = { exercice: true, series: true, nbRep: true, duree: true, tempsDeRepos: true, objectif: true, consignes: true };
  const [fromCircuits, fromTemplates] = await Promise.all([
    prisma.exercice.findMany({ where: { circuit: { auteurId: req.user.id } }, select: fields, orderBy: { id: "desc" } }),
    prisma.templateExercice.findMany({ where: { template: { coachId: req.user.id } }, select: fields, orderBy: { id: "desc" } }),
  ]);

  // Une entrée par nom (insensible à la casse). Ordre d'écrasement : catalogue
  // de base, puis templates, puis séances, des plus anciens aux plus récents ;
  // ce sont donc les paramètres de la séance la plus récente qui l'emportent.
  const byName = new Map(BASE_CATALOGUE.map((nom) => [nom.toLowerCase(), { exercice: nom }]));
  for (const ex of [...fromCircuits, ...fromTemplates].reverse()) {
    byName.set(ex.exercice.trim().toLowerCase(), { ...ex, exercice: ex.exercice.trim() });
  }
  res.json([...byName.values()].sort((a, b) => a.exercice.localeCompare(b.exercice, "fr")));
}

module.exports = { list, getById, create, update, remove, grade, catalogue };
