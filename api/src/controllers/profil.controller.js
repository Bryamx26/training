const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { PUBLIC_FIELDS } = require("../lib/profilFields");
const { isAdmin, isStaff, isAthlete } = require("../lib/permissions");
const { hasActiveSubscription, activateSubscription } = require("../lib/subscriptions");

// Liste de tous les comptes : réservée à un admin (voir profil.routes.js).
// Un coach passe par GET /api/me/subscribers pour ses sportifs.
async function list(req, res) {
  const profils = await prisma.profil.findMany({ select: PUBLIC_FIELDS });
  res.json(profils);
}

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

// MODIFIER ou SUPPRIMER un profil : soi-même, un admin, ou un coach pour un
// sportif activement abonné à lui.
async function findManageableProfil(req) {
  const target = await prisma.profil.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, role: true } });
  if (!target) throw new HttpError(404, "Profil introuvable", "PROFIL_NOT_FOUND");

  const allowed =
    req.user.id === target.id ||
    isAdmin(req.user) ||
    (isStaff(req.user) && isAthlete(target) && (await hasActiveSubscription(req.user.id, target.id)));
  if (!allowed) throw new HttpError(403, "Tu ne peux pas modifier ce profil", "FORBIDDEN");
  return target;
}

async function getById(req, res) {
  const id = Number(req.params.id);
  const allowed =
    req.user.id === id || isAdmin(req.user) || (isStaff(req.user) && (await coachKnowsAthlete(req.user.id, id)));
  if (!allowed) throw new HttpError(403, "Accès refusé", "FORBIDDEN");

  const profil = await prisma.profil.findUnique({
    where: { id },
    select: PUBLIC_FIELDS,
  });
  if (!profil) return res.status(404).json({ error: "Profil introuvable" });
  res.json(profil);
}

async function create(req, res) {
  const { nom, prenom, mail, motDePasse, poids, taille, age, blessures, role } = req.body;
  if (!nom || !prenom || !mail || !motDePasse) {
    return res.status(400).json({ error: "nom, prenom, mail et motDePasse sont requis" });
  }
  // L'inscription publique permet de choisir sportif ou coach, jamais admin.
  if (role === "ADMIN" && !(req.user && isAdmin(req.user))) {
    throw new HttpError(403, "Seul un admin peut créer un compte admin", "FORBIDDEN");
  }

  const hashed = await bcrypt.hash(motDePasse, 10);

  const profil = await prisma.profil.create({
    data: { nom, prenom, mail, motDePasse: hashed, poids, taille, age, blessures, role },
    select: PUBLIC_FIELDS,
  });

  // Un sportif créé par un coach (page Utilisateurs) est abonné à ce coach,
  // sinon le coach ne pourrait ni le voir ni l'ajouter à ses séances.
  if (req.user && isStaff(req.user) && isAthlete(profil)) {
    await activateSubscription(req.user.id, profil.id);
  }

  res.status(201).json(profil);
}

async function update(req, res) {
  const { nom, prenom, mail, motDePasse, poids, taille, age, blessures, role } = req.body;
  await findManageableProfil(req);
  if (role !== undefined && !isAdmin(req.user)) throw new HttpError(403, "Seul un admin peut changer un rôle", "FORBIDDEN");

  const data = { nom, prenom, mail, poids, taille, age, blessures, role };
  if (motDePasse) data.motDePasse = await bcrypt.hash(motDePasse, 10);

  const profil = await prisma.profil.update({
    where: { id: Number(req.params.id) },
    data,
    select: PUBLIC_FIELDS,
  });
  res.json(profil);
}

async function remove(req, res) {
  await findManageableProfil(req);
  await prisma.profil.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
