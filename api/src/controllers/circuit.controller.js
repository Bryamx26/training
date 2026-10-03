const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { isStaff, isAdmin, canViewCircuit } = require("../lib/permissions");
const { assertSubscribedAthletes } = require("../lib/subscriptions");
const { findManageableCircuit } = require("../lib/circuitAccess");

const INCLUDE = {
  auteur: { select: { id: true, nom: true, prenom: true } },
  exercices: { orderBy: { ordre: "asc" }, include: { muscles: { include: { muscle: true } }, notes: true } },
  personnes: { include: { profil: { select: { id: true, nom: true, prenom: true } } } },
};

async function list(req, res) {
  // Un sportif ne voit que les séances auxquelles il participe, un coach que les
  // siennes ; seul un admin voit tout. Les filtres de la requête ne peuvent
  // que restreindre ce périmètre.
  const profilId = isStaff(req.user) ? req.query.profilId : req.user.id;
  const auteurId = isAdmin(req.user) || !isStaff(req.user) ? req.query.auteurId : req.user.id;

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
  if (!canViewCircuit(req.user, circuit)) throw new HttpError(403, "Accès refusé", "FORBIDDEN");
  res.json(circuit);
}

async function create(req, res) {
  const { nom, note, niveau, type, date, participantIds, exercices } = req.body;
  if (!nom || !type || !date) {
    return res.status(400).json({ error: "nom, type et date sont requis" });
  }
  await assertSubscribedAthletes(req.user.id, participantIds ?? []);

  const circuit = await prisma.circuit.create({
    data: {
      nom,
      note,
      niveau,
      type,
      date: new Date(date),
      // L'auteur est toujours l'utilisateur connecté, pas une valeur envoyée par le client.
      auteurId: req.user.id,
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
  await findManageableCircuit(req.user, req.params.id);

  const circuit = await prisma.circuit.update({
    where: { id: Number(req.params.id) },
    data: { nom, note, niveau, type, date: date ? new Date(date) : undefined },
    include: INCLUDE,
  });
  res.json(circuit);
}

async function remove(req, res) {
  await findManageableCircuit(req.user, req.params.id);
  await prisma.circuit.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

async function setParticipants(req, res) {
  const circuitId = Number(req.params.id);
  const { participantIds } = req.body;
  if (!Array.isArray(participantIds)) {
    return res.status(400).json({ error: "participantIds doit être un tableau" });
  }
  const circuit = await findManageableCircuit(req.user, circuitId);

  // Seuls les sportifs AJOUTÉS doivent être abonnés à l'auteur de la séance :
  // un participant déjà présent reste dans la séance même s'il s'est désabonné.
  const currentIds = circuit.personnes.map((p) => p.profilId);
  const addedIds = participantIds.map(Number).filter((pid) => !currentIds.includes(pid));
  await assertSubscribedAthletes(circuit.auteurId, addedIds);

  await prisma.$transaction([
    prisma.circuitParticipant.deleteMany({ where: { circuitId } }),
    prisma.circuitParticipant.createMany({
      data: participantIds.map((profilId) => ({ circuitId, profilId: Number(profilId) })),
    }),
  ]);

  const updated = await prisma.circuit.findUnique({ where: { id: circuitId }, include: INCLUDE });
  res.json(updated);
}

async function addParticipant(req, res) {
  const circuitId = Number(req.params.id);
  const { profilId } = req.body;
  if (!profilId) return res.status(400).json({ error: "profilId est requis" });
  const circuit = await findManageableCircuit(req.user, circuitId);
  await assertSubscribedAthletes(circuit.auteurId, [profilId]);

  const participant = await prisma.circuitParticipant.create({
    data: { circuitId, profilId: Number(profilId) },
  });
  res.status(201).json(participant);
}

async function removeParticipant(req, res) {
  const circuitId = Number(req.params.id);
  const profilId = Number(req.params.profilId);
  await findManageableCircuit(req.user, circuitId);

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
