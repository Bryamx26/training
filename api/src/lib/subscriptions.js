const prisma = require("./prisma");
const HttpError = require("./httpError");

// Accès aux abonnements coach → sportif, partagé par les controllers.

async function hasActiveSubscription(coachId, athleteId) {
  const subscription = await prisma.coachSubscription.findUnique({
    where: { coachId_athleteId: { coachId, athleteId } },
    select: { status: true },
  });
  return subscription?.status === "ACTIVE";
}

// Règle métier centrale : un coach ne peut ajouter à ses séances que des
// sportifs existants et activement abonnés à lui. Lance 404 / 403 sinon.
// Le coach lui-même peut toujours participer à ses propres séances.
async function assertSubscribedAthletes(coachId, athleteIds) {
  const ids = [...new Set(athleteIds.map(Number))].filter((id) => id !== coachId);
  if (ids.length === 0) return;

  const athletes = await prisma.profil.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const missing = ids.filter((id) => !athletes.some((a) => a.id === id));
  if (missing.length) throw new HttpError(404, `Sportif introuvable (id ${missing.join(", ")})`, "ATHLETE_NOT_FOUND");

  const active = await prisma.coachSubscription.findMany({
    where: { coachId, athleteId: { in: ids }, status: "ACTIVE" },
    select: { athleteId: true },
  });
  const notSubscribed = ids.filter((id) => !active.some((s) => s.athleteId === id));
  if (notSubscribed.length) {
    throw new HttpError(
      403,
      `Ce sportif n'est pas abonné à ce coach : il ne peut pas être ajouté à la séance (id ${notSubscribed.join(", ")})`,
      "ATHLETE_NOT_SUBSCRIBED"
    );
  }
}

// Abonne (ou réabonne) un sportif à un coach, sans jamais créer de doublon.
function activateSubscription(coachId, athleteId) {
  return prisma.coachSubscription.upsert({
    where: { coachId_athleteId: { coachId, athleteId } },
    update: { status: "ACTIVE" },
    create: { coachId, athleteId, status: "ACTIVE" },
  });
}

module.exports = { hasActiveSubscription, assertSubscribedAthletes, activateSubscription };
