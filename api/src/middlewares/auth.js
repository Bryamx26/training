const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { verifyToken } = require("../lib/token");
const { isStaff, isAdmin } = require("../lib/permissions");

// Lit le jeton « Authorization: Bearer <jeton> » et charge l'utilisateur
// correspondant. Renvoie null s'il n'y a pas de jeton ; lance une 401 si le
// jeton est invalide ou si le compte n'existe plus.
async function loadUser(req) {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return null;

  const profilId = verifyToken(header.slice("Bearer ".length));
  const user = profilId
    ? await prisma.profil.findUnique({ where: { id: profilId }, select: { id: true, role: true } })
    : null;
  if (!user) throw new HttpError(401, "Session expirée, reconnecte-toi", "SESSION_EXPIRED");
  return user;
}

// Route réservée aux utilisateurs connectés : pose req.user = { id, role }.
async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) throw new HttpError(401, "Connexion requise", "UNAUTHENTICATED");
    next();
  } catch (err) {
    next(err);
  }
}

// Route ouverte à tous, mais qui a besoin de savoir qui appelle s'il est connecté.
async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

// À placer après requireAuth : réserve la route aux coachs et admins.
function requireStaff(req, res, next) {
  if (!isStaff(req.user)) return next(new HttpError(403, "Réservé aux coachs", "FORBIDDEN"));
  next();
}

// À placer après requireAuth : réserve la route aux admins.
function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) return next(new HttpError(403, "Réservé aux administrateurs", "FORBIDDEN"));
  next();
}

module.exports = { requireAuth, optionalAuth, requireStaff, requireAdmin };
