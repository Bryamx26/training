const jwt = require("jsonwebtoken");

// Jetons de session signés (JWT). Le jeton ne contient que l'id du profil :
// le rôle est relu en base à chaque requête (voir middlewares/auth.js), pour
// qu'un changement de rôle ou une suppression de compte s'applique tout de suite.
const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

if (!SECRET) {
  throw new Error("JWT_SECRET n'est pas défini : ajoute-le dans le fichier .env (voir .env.example).");
}

// Le navigateur reçoit le jeton dans un cookie httpOnly : il n'est jamais
// lisible par le JavaScript de la page (protection contre le vol par XSS).
// SameSite=Lax empêche son envoi depuis un formulaire d'un autre site.
const COOKIE_NAME = "session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/api",
};

function signToken(profilId) {
  return jwt.sign({ sub: String(profilId) }, SECRET, { expiresIn: EXPIRES_IN_MS / 1000 });
}

// Renvoie l'id du profil, ou null si le jeton est invalide ou expiré.
function verifyToken(token) {
  try {
    const { sub } = jwt.verify(token, SECRET);
    return Number(sub);
  } catch {
    return null;
  }
}

function setSessionCookie(res, profilId) {
  res.cookie(COOKIE_NAME, signToken(profilId), { ...COOKIE_OPTIONS, maxAge: EXPIRES_IN_MS });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
}

module.exports = { signToken, verifyToken, setSessionCookie, clearSessionCookie, COOKIE_NAME };
