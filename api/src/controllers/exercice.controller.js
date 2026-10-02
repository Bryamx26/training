const prisma = require("../lib/prisma");

const INCLUDE = { muscles: { include: { muscle: true } }, notes: true };

function serialize(exercice) {
  return { ...exercice, muscles: exercice.muscles.map((m) => m.muscle) };
}

async function list(req, res) {
  const where = req.query.circuitId ? { circuitId: Number(req.query.circuitId) } : undefined;
  const exercices = await prisma.exercice.findMany({
    where,
    include: INCLUDE,
    orderBy: { ordre: "asc" },
  });
  res.json(exercices.map(serialize));
}

async function getById(req, res) {
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
  await prisma.exercice.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

// Note d'un exercice pour un participant précis : chaque sportif d'une séance
// de groupe est noté indépendamment des autres.
async function grade(req, res) {
  const exerciceId = Number(req.params.id);
  const profilId = Number(req.params.profilId);
  const { note, commentaire } = req.body;

  const noteEntry = await prisma.exerciceNote.upsert({
    where: { exerciceId_profilId: { exerciceId, profilId } },
    update: { note, commentaire },
    create: { exerciceId, profilId, note, commentaire },
  });
  res.json(noteEntry);
}

module.exports = { list, getById, create, update, remove, grade };
