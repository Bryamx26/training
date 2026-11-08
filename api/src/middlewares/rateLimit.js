const { rateLimit } = require("express-rate-limit");
const { isStaff } = require("../lib/permissions");

// Limites par adresse IP sur les routes publiques sensibles, contre le test de
// mots de passe en masse et la création de comptes à la chaîne. Réglable par
// AUTH_RATE_LIMIT (requêtes par tranche de 15 minutes).
function limiter({ skipSuccessfulRequests, skip }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    handler: (req, res) =>
      res.status(429).json({ error: "Trop de tentatives, réessaie dans quelques minutes", code: "TOO_MANY_REQUESTS" }),
  });
}

// Connexion : seuls les échecs consomment un essai.
const loginLimiter = limiter({ skipSuccessfulRequests: true });
// Inscription publique : chaque compte créé compte. Seul un coach (ou admin)
// connecté qui crée les comptes de ses sportifs n'est pas limité (à placer
// après optionalAuth).
const signupLimiter = limiter({ skipSuccessfulRequests: false, skip: (req) => Boolean(req.user && isStaff(req.user)) });

module.exports = { loginLimiter, signupLimiter };
