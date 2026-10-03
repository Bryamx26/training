const jwt = require("jsonwebtoken");

// Jetons de session signés (JWT). Le jeton ne contient que l'id du profil :
// le rôle est relu en base à chaque requête (voir middlewares/auth.js), pour
// qu'un changement de rôle ou une suppression de compte s'applique tout de suite.
const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = "7d";

if (!SECRET) {
  throw new Error("JWT_SECRET n'est pas défini : ajoute-le dans le fichier .env (voir .env.example).");
}

function signToken(profilId) {
  return jwt.sign({ sub: String(profilId) }, SECRET, { expiresIn: EXPIRES_IN });
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

module.exports = { signToken, verifyToken };
