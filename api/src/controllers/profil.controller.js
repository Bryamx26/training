const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { PUBLIC_FIELDS } = require("../lib/profilFields");
const { isAdmin, isStaff, isAthlete } = require("../lib/permissions");
const { hasActiveSubscription, activateSubscription } = require("../lib/subscriptions");
const { assertCanViewProfil } = require("../lib/profilAccess");
const { notify } = require("../lib/notifications");
const { validate, parseId } = require("../lib/validation");
const schemas = require("../lib/schemas");

// Champs qu'un coach peut modifier sur un sportif abonné qui a créé son compte
// lui-même : le suivi physique, jamais l'identité ni les accès au compte.
const LIMITED_FIELDS = ["poids", "taille", "age", "blessures"];

// Adresse déjà prise : message explicite plutôt que l'erreur générique de contrainte unique.
function mailTaken(err) {
  if (err.code === "P2002") throw new HttpError(409, "Un compte existe déjà avec cette adresse e-mail", "MAIL_TAKEN");
  throw err;
}

// Liste de tous les comptes : réservée à un admin (voir profil.routes.js).
// Un coach passe par GET /api/me/subscribers pour ses sportifs.
// ?demandeCoach=true : seulement les demandes de compte coach en attente.
async function list(req, res) {
  const where = req.query.demandeCoach === "true" ? { demandeCoach: true } : undefined;
  const profils = await prisma.profil.findMany({ where, select: PUBLIC_FIELDS, orderBy: { createdAt: "desc" } });
  res.json(profils);
}

// MODIFIER ou SUPPRIMER un profil. Renvoie la cible et le niveau d'accès :
// - "full" : soi-même, un admin, ou le coach qui a créé ce compte (et dont le
//   sportif est toujours abonné) ;
// - "limited" : un coach dont le sportif, inscrit par lui-même, est abonné :
//   suivi physique seulement (LIMITED_FIELDS), pas de suppression.
async function findManageableProfil(req) {
  const target = await prisma.profil.findUnique({
    where: { id: parseId(req.params.id) },
    select: { id: true, role: true, creeParId: true },
  });
  if (!target) throw new HttpError(404, "Profil introuvable", "PROFIL_NOT_FOUND");

  if (req.user.id === target.id || isAdmin(req.user)) return { target, access: "full" };
  if (isStaff(req.user) && isAthlete(target) && (await hasActiveSubscription(req.user.id, target.id))) {
    return { target, access: target.creeParId === req.user.id ? "full" : "limited" };
  }
  throw new HttpError(403, "Tu ne peux pas modifier ce profil", "FORBIDDEN");
}

async function getById(req, res) {
  const id = parseId(req.params.id);
  await assertCanViewProfil(req.user, id);

  const profil = await prisma.profil.findUnique({ where: { id }, select: PUBLIC_FIELDS });
  if (!profil) throw new HttpError(404, "Profil introuvable", "PROFIL_NOT_FOUND");
  res.json(profil);
}

// Inscription publique, ou création d'un compte par un coach / un admin.
async function create(req, res) {
  const { motDePasse, role: requestedRole, accepteCgu, ...data } = validate(schemas.profilCreate, req.body);
  // Connecté, seul le staff crée des comptes (ses sportifs) : un sportif
  // connecté ne doit pas pouvoir créer des comptes à la chaîne.
  if (req.user && !isStaff(req.user)) throw new HttpError(403, "Seul un coach peut créer un compte", "FORBIDDEN");
  const admin = req.user && isAdmin(req.user);

  // Inscription publique : la personne doit accepter les CGU et la politique de
  // confidentialité ; la date est conservée comme preuve du consentement.
  // Un compte créé par un coach les acceptera à sa première connexion (POST /api/me/cgu).
  if (!req.user) {
    if (accepteCgu !== true) {
      throw new HttpError(400, "Tu dois accepter les conditions d'utilisation et la politique de confidentialité", "CGU_REQUIRED");
    }
    data.cguAccepteesLe = new Date();
  } else {
    data.creeParId = req.user.id;
  }

  // Seul un admin attribue directement un rôle de staff. Une inscription
  // publique « coach » crée un compte sportif avec une demande à valider ;
  // un coach connecté ne crée que des sportifs.
  let role = "USER";
  let demandeCoach = false;
  if (admin) role = requestedRole ?? "USER";
  else if (requestedRole === "ADMIN") throw new HttpError(403, "Seul un admin peut créer un compte admin", "FORBIDDEN");
  else if (requestedRole === "COACH" && !req.user) demandeCoach = true;

  const profil = await prisma.profil.create({
    data: { ...data, role, demandeCoach, motDePasse: await bcrypt.hash(motDePasse, 10) },
    select: PUBLIC_FIELDS,
  }).catch(mailTaken);

  // Un sportif créé par un coach (page Utilisateurs) est abonné à ce coach,
  // sinon le coach ne pourrait ni le voir ni l'ajouter à ses séances.
  if (req.user && isStaff(req.user) && isAthlete(profil)) {
    await activateSubscription(req.user.id, profil.id);
  }

  if (demandeCoach) {
    const admins = await prisma.profil.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await notify(
      admins.map((a) => a.id),
      { type: "DEMANDE_COACH", message: `${profil.prenom} ${profil.nom} demande un compte coach`, lien: "/admin/utilisateurs" }
    );
  }

  res.status(201).json(profil);
}

async function update(req, res) {
  const { motDePasse, ...data } = validate(schemas.profilUpdate, req.body);
  const { target, access } = await findManageableProfil(req);
  if ((data.role !== undefined || data.demandeCoach !== undefined) && !isAdmin(req.user)) {
    throw new HttpError(403, "Seul un admin peut changer un rôle", "FORBIDDEN");
  }
  if (access === "limited") {
    const forbidden = [...Object.keys(data), ...(motDePasse !== undefined ? ["motDePasse"] : [])].filter(
      (field) => !LIMITED_FIELDS.includes(field)
    );
    if (forbidden.length) {
      throw new HttpError(
        403,
        `Ce sportif a créé son compte lui-même : tu ne peux modifier que son suivi physique (${forbidden.join(", ")} refusé)`,
        "FIELD_FORBIDDEN"
      );
    }
  }

  // Attribuer un rôle traite la demande de compte coach éventuelle.
  if (data.role !== undefined) data.demandeCoach = false;
  if (motDePasse) data.motDePasse = await bcrypt.hash(motDePasse, 10);

  const profil = await prisma.profil.update({ where: { id: target.id }, data, select: PUBLIC_FIELDS }).catch(mailTaken);

  if (data.role === "COACH" && target.role !== "COACH") {
    await notify([profil.id], { type: "COACH_VALIDE", message: "Ton compte coach a été validé", lien: "/" });
  }
  res.json(profil);
}

async function remove(req, res) {
  const { target, access } = await findManageableProfil(req);
  if (access !== "full") {
    throw new HttpError(403, "Ce sportif a créé son compte lui-même : tu peux seulement le retirer de tes sportifs", "FORBIDDEN");
  }
  await prisma.profil.delete({ where: { id: target.id } });
  res.status(204).send();
}

// POST /api/me/cgu — l'utilisateur connecté accepte les CGU et la politique
// de confidentialité (compte créé par un coach, première connexion).
async function acceptCgu(req, res) {
  const profil = await prisma.profil.update({
    where: { id: req.user.id },
    data: { cguAccepteesLe: new Date() },
    select: PUBLIC_FIELDS,
  });
  res.json(profil);
}

module.exports = { list, getById, create, update, remove, acceptCgu };
