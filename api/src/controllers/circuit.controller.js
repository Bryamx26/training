const prisma = require("../lib/prisma");

const INCLUDE = {
  auteur: { select: { id: true, nom: true, prenom: true } },
  exercices: { orderBy: { ordre: "asc" }, include: { muscles: { include: { muscle: true } }, notes: true } },
  personnes: { include: { profil: { select: { id: true, nom: true, prenom: true } } } },
};

async function list(req, res) {
  const { profilId, auteurId } = req.query;

  const where = {};
  if (profilId) where.personnes = { some: { profilId: Number(profilId) } };
  if (auteurId) where.auteurId = Number(auteurId);

  const circuits = await prisma.circuit.findMany({
    where,
    include: INCLUDE,
    orderBy: { date: "desc" },
  });
  res.json(circuits);
}

async function getById(req, res) {
  const circuit = await prisma.circuit.findUnique({
    where: { id: Number(req.params.id) },
    include: INCLUDE,
  });
  if (!circuit) return res.status(404).json({ error: "Circuit introuvable" });
  res.json(circuit);
}

async function create(req, res) {
  const { nom, note, niveau, type, date, auteurId, participantIds, exercices } = req.body;
  if (!nom || !type || !date || !auteurId) {
    return res.status(400).json({ error: "nom, type, date et auteurId sont requis" });
  }

  const circuit = await prisma.circuit.create({
    data: {
      nom,
      note,
      niveau,
      type,
      date: new Date(date),
      auteurId: Number(auteurId),
      personnes: participantIds
        ? { create: participantIds.map((profilId) => ({ profilId: Number(profilId) })) }
        : undefined,
      exercices: exercices
        ? {
            create: exercices.map((ex, i) => ({
              exercice: ex.exercice,
              description: ex.description,
              consignes: ex.consignes,
              objectif: ex.objectif,
              series: ex.series,
              nbRep: ex.nbRep,
              duree: ex.duree,
              tempsDeRepos: ex.tempsDeRepos,
              tempo: ex.tempo,
              lest: ex.lest,
              amplitude: ex.amplitude,
              url: ex.url,
              ordre: i,
            })),
          }
        : undefined,
    },
    include: INCLUDE,
  });
  res.status(201).json(circuit);
}

async function update(req, res) {
  const { nom, note, niveau, type, date } = req.body;

  const circuit = await prisma.circuit.update({
    where: { id: Number(req.params.id) },
    data: { nom, note, niveau, type, date: date ? new Date(date) : undefined },
    include: INCLUDE,
  });
  res.json(circuit);
}

async function remove(req, res) {
  await prisma.circuit.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

async function setParticipants(req, res) {
  const circuitId = Number(req.params.id);
  const { participantIds } = req.body;
  if (!Array.isArray(participantIds)) {
    return res.status(400).json({ error: "participantIds doit être un tableau" });
  }

  await prisma.$transaction([
    prisma.circuitParticipant.deleteMany({ where: { circuitId } }),
    prisma.circuitParticipant.createMany({
      data: participantIds.map((profilId) => ({ circuitId, profilId: Number(profilId) })),
    }),
  ]);

  const circuit = await prisma.circuit.findUnique({ where: { id: circuitId }, include: INCLUDE });
  res.json(circuit);
}

async function addParticipant(req, res) {
  const circuitId = Number(req.params.id);
  const { profilId } = req.body;
  if (!profilId) return res.status(400).json({ error: "profilId est requis" });

  const participant = await prisma.circuitParticipant.create({
    data: { circuitId, profilId: Number(profilId) },
  });
  res.status(201).json(participant);
}

async function removeParticipant(req, res) {
  const circuitId = Number(req.params.id);
  const profilId = Number(req.params.profilId);

  await prisma.circuitParticipant.delete({
    where: { circuitId_profilId: { circuitId, profilId } },
  });
  res.status(204).send();
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  addParticipant,
  removeParticipant,
  setParticipants,
};
