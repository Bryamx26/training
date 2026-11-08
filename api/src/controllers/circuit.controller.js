const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { isStaff, isAdmin, canViewCircuit } = require("../lib/permissions");
const { assertSubscribedAthletes } = require("../lib/subscriptions");
const { findManageableCircuit } = require("../lib/circuitAccess");
const { parseExercice, parseMuscleIds } = require("../lib/exerciceData");
const { notify, formatDate } = require("../lib/notifications");
const { validate } = require("../lib/validation");
const schemas = require("../lib/schemas");

const INCLUDE = {
  auteur: { select: { id: true, nom: true, prenom: true } },
  exercices: { orderBy: { ordre: "asc" }, include: { muscles: { include: { muscle: true } }, notes: true } },
  personnes: { include: { profil: { select: { id: true, nom: true, prenom: true } } } },
};

const INCLUDE_DETAIL = {
  ...INCLUDE,
  realisations: { include: { series: { orderBy: [{ exerciceId: "asc" }, { serie: "asc" }] } } },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Un sportif ne voit que SA réalisation d'une séance ; l'auteur et l'admin voient tout.
function serializeDetail(circuit, user) {
  if (!circuit.realisations) return circuit;
  const isManager = isAdmin(user) || circuit.auteurId === user.id;
  return { ...circuit, realisations: isManager ? circuit.realisations : circuit.realisations.filter((r) => r.profilId === user.id) };
}

async function list(req, res) {
  // Un sportif ne voit que les séances auxquelles il participe, un coach que les
  // siennes ; seul un admin voit tout. Les filtres de la requête ne peuvent
  // que restreindre ce périmètre.
  const profilId = isStaff(req.user) ? req.query.profilId : req.user.id;
  const auteurId = isAdmin(req.user) || !isStaff(req.user) ? req.query.auteurId : req.user.id;

  const where = {};
  if (profilId) where.personnes = { some: { profilId: Number(profilId) } };
  if (auteurId) where.auteurId = Number(auteurId);
  // ?from=AAAA-MM-JJ&to=AAAA-MM-JJ : séances de la période (vue calendrier).
  if (req.query.from || req.query.to) {
    where.date = {};
    if (req.query.from) where.date.gte = new Date(req.query.from);
    if (req.query.to) where.date.lt = new Date(new Date(req.query.to).getTime() + DAY_MS);
  }

  const circuits = await prisma.circuit.findMany({ where, include: INCLUDE, orderBy: { date: "desc" } });
  res.json(circuits);
}

async function getById(req, res) {
  const circuit = await prisma.circuit.findUnique({ where: { id: Number(req.params.id) }, include: INCLUDE_DETAIL });
  if (!circuit) throw new HttpError(404, "Séance introuvable", "CIRCUIT_NOT_FOUND");
  if (!canViewCircuit(req.user, circuit)) throw new HttpError(403, "Accès refusé", "FORBIDDEN");
  res.json(serializeDetail(circuit, req.user));
}

function exerciceCreateData(raw, ordre) {
  const muscleIds = parseMuscleIds(raw.muscleIds);
  return {
    ...parseExercice(raw, ordre),
    muscles: muscleIds ? { create: muscleIds.map((muscleId) => ({ muscleId })) } : undefined,
  };
}

function notifyNewCircuit(circuit, participantIds, auteurId) {
  return notify(
    participantIds,
    { type: "NOUVELLE_SEANCE", message: `Nouvelle séance « ${circuit.nom} » le ${formatDate(circuit.date)}`, lien: `/seances/${circuit.id}` },
    { except: auteurId }
  );
}

// POST /api/circuits — avec `repetition: { semaines: N }`, crée N séances
// identiques à une semaine d'intervalle et renvoie la première.
async function create(req, res) {
  const { participantIds = [], exercices = [], repetition, ...data } = validate(schemas.circuitCreate, req.body);
  const exercicesData = exercices.map(exerciceCreateData);
  await assertSubscribedAthletes(req.user.id, participantIds);

  const occurrences = repetition?.semaines ?? 1;
  const created = await prisma.$transaction(
    Array.from({ length: occurrences }, (_, i) =>
      prisma.circuit.create({
        data: {
          ...data,
          date: new Date(data.date.getTime() + i * 7 * DAY_MS),
          // L'auteur est toujours l'utilisateur connecté, pas une valeur envoyée par le client.
          auteurId: req.user.id,
          personnes: { create: participantIds.map((profilId) => ({ profilId })) },
          exercices: { create: exercicesData },
        },
        include: INCLUDE,
      })
    )
  );

  if (participantIds.length) {
    const [first] = created;
    const message =
      occurrences > 1
        ? `${occurrences} nouvelles séances « ${first.nom} », chaque semaine à partir du ${formatDate(first.date)}`
        : null;
    if (message) await notify(participantIds, { type: "NOUVELLE_SEANCE", message, lien: "/seances" }, { except: req.user.id });
    else await notifyNewCircuit(first, participantIds, req.user.id);
  }

  res.status(201).json({ ...created[0], occurrenceIds: created.map((c) => c.id) });
}

async function update(req, res) {
  const data = validate(schemas.circuitUpdate, req.body);
  const existing = await findManageableCircuit(req.user, req.params.id);

  const circuit = await prisma.circuit.update({ where: { id: existing.id }, data, include: INCLUDE });
  res.json(circuit);
}

async function remove(req, res) {
  const existing = await findManageableCircuit(req.user, req.params.id);
  await prisma.circuit.delete({ where: { id: existing.id } });
  res.status(204).send();
}

async function setParticipants(req, res) {
  const { participantIds } = validate(schemas.participants, req.body);
  const circuit = await findManageableCircuit(req.user, req.params.id);

  // Seuls les sportifs AJOUTÉS doivent être abonnés à l'auteur de la séance :
  // un participant déjà présent reste dans la séance même s'il s'est désabonné.
  const currentIds = circuit.personnes.map((p) => p.profilId);
  const addedIds = [...new Set(participantIds)].filter((pid) => !currentIds.includes(pid));
  await assertSubscribedAthletes(circuit.auteurId, addedIds);

  await prisma.$transaction([
    prisma.circuitParticipant.deleteMany({ where: { circuitId: circuit.id } }),
    prisma.circuitParticipant.createMany({
      data: [...new Set(participantIds)].map((profilId) => ({ circuitId: circuit.id, profilId })),
    }),
  ]);

  const updated = await prisma.circuit.findUnique({ where: { id: circuit.id }, include: INCLUDE });
  await notifyNewCircuit(updated, addedIds, req.user.id);
  res.json(updated);
}

async function addParticipant(req, res) {
  const { profilId } = validate(schemas.participant, req.body);
  const circuit = await findManageableCircuit(req.user, req.params.id);
  await assertSubscribedAthletes(circuit.auteurId, [profilId]);

  const participant = await prisma.circuitParticipant.create({ data: { circuitId: circuit.id, profilId } });
  const full = await prisma.circuit.findUnique({ where: { id: circuit.id }, select: { id: true, nom: true, date: true } });
  await notifyNewCircuit(full, [profilId], req.user.id);
  res.status(201).json(participant);
}

async function removeParticipant(req, res) {
  const circuit = await findManageableCircuit(req.user, req.params.id);
  await prisma.circuitParticipant.delete({
    where: { circuitId_profilId: { circuitId: circuit.id, profilId: Number(req.params.profilId) } },
  });
  res.status(204).send();
}

// PUT /api/circuits/:id/realisation — le participant connecté enregistre ce
// qu'il a réellement fait (séries, charges). Remplace la saisie
// précédente de cette séance.
async function saveRealisation(req, res) {
  const { series, ...data } = validate(schemas.realisation, req.body);
  const circuit = await prisma.circuit.findUnique({
    where: { id: Number(req.params.id) },
    select: { id: true, nom: true, auteurId: true, personnes: { select: { profilId: true } }, exercices: { select: { id: true } } },
  });
  if (!circuit) throw new HttpError(404, "Séance introuvable", "CIRCUIT_NOT_FOUND");
  if (!circuit.personnes.some((p) => p.profilId === req.user.id)) {
    throw new HttpError(403, "Seul un participant peut enregistrer sa séance", "NOT_A_PARTICIPANT");
  }
  const exerciceIds = new Set(circuit.exercices.map((e) => e.id));
  const foreign = series.find((s) => !exerciceIds.has(s.exerciceId));
  if (foreign) throw new HttpError(400, `L'exercice ${foreign.exerciceId} n'appartient pas à cette séance`, "VALIDATION_ERROR");

  const where = { circuitId_profilId: { circuitId: circuit.id, profilId: req.user.id } };
  const existing = await prisma.realisation.findUnique({ where, select: { id: true } });
  const [, realisation] = await prisma.$transaction([
    prisma.serieRealisee.deleteMany({ where: { realisationId: existing?.id ?? -1 } }),
    prisma.realisation.upsert({
      where,
      update: { ...data, series: { create: series } },
      create: { ...data, circuitId: circuit.id, profilId: req.user.id, series: { create: series } },
      include: { series: { orderBy: [{ exerciceId: "asc" }, { serie: "asc" }] } },
    }),
  ]);

  if (!existing) {
    const athlete = await prisma.profil.findUnique({ where: { id: req.user.id }, select: { prenom: true, nom: true } });
    await notify(
      [circuit.auteurId],
      { type: "SEANCE_REALISEE", message: `${athlete.prenom} ${athlete.nom} a terminé « ${circuit.nom} »`, lien: `/seances/${circuit.id}` },
      { except: req.user.id }
    );
  }
  res.json(realisation);
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
  saveRealisation,
};
