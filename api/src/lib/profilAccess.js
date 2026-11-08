const prisma = require("./prisma");
const HttpError = require("./httpError");
const { isAdmin, isStaff } = require("./permissions");

// Un coach peut CONSULTER un sportif qui est ou a été lié à lui : abonnement
// (même annulé) ou participation à l'une de ses séances. L'historique reste
// ainsi accessible après un désabonnement.
async function coachKnowsAthlete(coachId, athleteId) {
  const [subscription, participation] = await Promise.all([
    prisma.coachSubscription.findUnique({ where: { coachId_athleteId: { coachId, athleteId } } }),
    prisma.circuitParticipant.findFirst({ where: { profilId: athleteId, circuit: { auteurId: coachId } } }),
  ]);
  return Boolean(subscription || participation);
}

// Lire les données d'un profil (fiche, statistiques) : soi-même, un admin, ou
// un coach lié à ce sportif. Lance 403 sinon.
async function assertCanViewProfil(user, profilId) {
  const allowed =
    user.id === profilId || isAdmin(user) || (isStaff(user) && (await coachKnowsAthlete(user.id, profilId)));
  if (!allowed) throw new HttpError(403, "Accès refusé", "FORBIDDEN");
}

module.exports = { coachKnowsAthlete, assertCanViewProfil };
