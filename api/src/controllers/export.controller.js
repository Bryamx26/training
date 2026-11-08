const prisma = require("../lib/prisma");
const { PUBLIC_FIELDS } = require("../lib/profilFields");

const PERSON = { id: true, prenom: true, nom: true };

// GET /api/me/export — toutes les données personnelles du compte connecté, en
// JSON téléchargeable (droit d'accès et à la portabilité, RGPD art. 15 et 20).
// Jamais le hash du mot de passe.
async function exportMine(req, res) {
  const id = req.user.id;
  const [profil, participations, realisations, notesRecues, abonnements, abonnes, seancesCreees, templates, notifications] =
    await Promise.all([
      prisma.profil.findUnique({ where: { id }, select: PUBLIC_FIELDS }),
      prisma.circuitParticipant.findMany({
        where: { profilId: id },
        include: { circuit: { select: { id: true, nom: true, type: true, niveau: true, date: true, auteur: { select: PERSON } } } },
      }),
      prisma.realisation.findMany({ where: { profilId: id }, include: { series: true } }),
      prisma.exerciceNote.findMany({ where: { profilId: id }, include: { exercice: { select: { id: true, exercice: true, circuitId: true } } } }),
      prisma.coachSubscription.findMany({ where: { athleteId: id }, include: { coach: { select: PERSON } } }),
      prisma.coachSubscription.findMany({ where: { coachId: id }, include: { athlete: { select: PERSON } } }),
      prisma.circuit.findMany({ where: { auteurId: id }, include: { exercices: true } }),
      prisma.circuitTemplate.findMany({ where: { coachId: id }, include: { exercices: true } }),
      prisma.notification.findMany({ where: { profilId: id }, orderBy: { createdAt: "desc" } }),
    ]);

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Disposition", `attachment; filename="sport-track-donnees-${date}.json"`);
  res.json({
    exporteLe: new Date().toISOString(),
    profil,
    seances: participations.map((p) => p.circuit),
    realisations,
    notesRecues,
    abonnements,
    abonnes,
    seancesCreees,
    templates,
    notifications,
  });
}

module.exports = { exportMine };
