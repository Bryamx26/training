const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { PUBLIC_FIELDS, COACH_FIELDS } = require("../lib/profilFields");
const { isStaff, isAthlete } = require("../lib/permissions");
const { activateSubscription } = require("../lib/subscriptions");

const COACH_ROLES = ["COACH", "ADMIN"];
const SEARCH_LIMIT = 20;

// Charge le coach ciblé par l'URL : 404 s'il n'existe pas, 400 si ce n'est pas un coach.
async function findCoach(coachId) {
  const coach = await prisma.profil.findUnique({ where: { id: Number(coachId) }, select: COACH_FIELDS });
  if (!coach) throw new HttpError(404, "Coach introuvable", "COACH_NOT_FOUND");
  if (!isStaff(coach)) throw new HttpError(400, "Cet utilisateur n'est pas un coach", "NOT_A_COACH");
  return coach;
}

function serializeSubscription(s) {
  return { coachId: s.coachId, athleteId: s.athleteId, status: s.status, createdAt: s.createdAt, updatedAt: s.updatedAt };
}

// GET /api/coaches?search= — coachs dont le prénom ou le nom contient `search`,
// avec pour chacun l'indication « l'utilisateur connecté y est abonné ».
async function searchCoaches(req, res) {
  const search = String(req.query.search ?? "").trim();

  const coaches = await prisma.profil.findMany({
    where: {
      role: { in: COACH_ROLES },
      id: { not: req.user.id },
      ...(search && { OR: [{ prenom: { contains: search } }, { nom: { contains: search } }] }),
    },
    select: {
      ...COACH_FIELDS,
      abonnes: { where: { athleteId: req.user.id, status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: [{ prenom: "asc" }, { nom: "asc" }],
    take: SEARCH_LIMIT,
  });

  res.json(coaches.map(({ abonnes, ...coach }) => ({ ...coach, subscribed: abonnes.length > 0 })));
}

// GET /api/coaches/:coachId — fiche d'un coach.
async function getCoach(req, res) {
  const coach = await findCoach(req.params.coachId);
  const [subscribersCount, circuitsCount, mine] = await Promise.all([
    prisma.coachSubscription.count({ where: { coachId: coach.id, status: "ACTIVE" } }),
    prisma.circuit.count({ where: { auteurId: coach.id } }),
    prisma.coachSubscription.findUnique({ where: { coachId_athleteId: { coachId: coach.id, athleteId: req.user.id } } }),
  ]);
  res.json({ ...coach, subscribersCount, circuitsCount, subscribed: mine?.status === "ACTIVE" });
}

// POST /api/coaches/:coachId/subscribe — abonne le sportif connecté.
// Une relation annulée est réactivée plutôt que dupliquée.
async function subscribe(req, res) {
  if (!isAthlete(req.user)) throw new HttpError(403, "Seuls les sportifs peuvent s'abonner à un coach", "ONLY_ATHLETES");
  const coach = await findCoach(req.params.coachId);

  const existing = await prisma.coachSubscription.findUnique({
    where: { coachId_athleteId: { coachId: coach.id, athleteId: req.user.id } },
  });
  if (existing?.status === "ACTIVE") throw new HttpError(409, "Tu es déjà abonné à ce coach", "ALREADY_SUBSCRIBED");

  const subscription = await activateSubscription(coach.id, req.user.id);
  res.status(existing ? 200 : 201).json(serializeSubscription(subscription));
}

// PATCH /api/coaches/:coachId/subscribe { status: "cancelled" } — désabonne le
// sportif connecté. La relation est conservée (statut CANCELLED), ainsi que
// les participations aux séances passées.
async function updateSubscription(req, res) {
  const status = String(req.body?.status ?? "").toUpperCase();
  if (status !== "CANCELLED") {
    throw new HttpError(400, 'Statut invalide : seul "cancelled" est accepté (utilise POST pour s\'abonner)', "INVALID_STATUS");
  }
  const coach = await findCoach(req.params.coachId);

  const where = { coachId_athleteId: { coachId: coach.id, athleteId: req.user.id } };
  const existing = await prisma.coachSubscription.findUnique({ where });
  if (existing?.status !== "ACTIVE") throw new HttpError(404, "Aucun abonnement actif à ce coach", "SUBSCRIPTION_NOT_FOUND");

  const subscription = await prisma.coachSubscription.update({ where, data: { status: "CANCELLED" } });
  res.json(serializeSubscription(subscription));
}

// GET /api/me/coaches — coachs que le sportif connecté suit actuellement.
async function myCoaches(req, res) {
  const subscriptions = await prisma.coachSubscription.findMany({
    where: { athleteId: req.user.id, status: "ACTIVE" },
    select: { createdAt: true, updatedAt: true, coach: { select: COACH_FIELDS } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(subscriptions.map((s) => ({ ...s.coach, subscribed: true, subscribedAt: s.updatedAt })));
}

// GET /api/me/subscribers — abonnés actifs du coach connecté (coach uniquement).
async function mySubscribers(req, res) {
  const subscriptions = await prisma.coachSubscription.findMany({
    where: { coachId: req.user.id, status: "ACTIVE" },
    select: { updatedAt: true, athlete: { select: PUBLIC_FIELDS } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(subscriptions.map((s) => ({ ...s.athlete, subscribedAt: s.updatedAt })));
}

module.exports = { searchCoaches, getCoach, subscribe, updateSubscription, myCoaches, mySubscribers };
