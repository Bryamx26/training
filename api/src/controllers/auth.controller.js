const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { PUBLIC_FIELDS } = require("../lib/profilFields");
const { setSessionCookie, clearSessionCookie } = require("../lib/token");
const { validate } = require("../lib/validation");
const schemas = require("../lib/schemas");

// Réponse commune aux deux modes de connexion : le cookie de session (httpOnly,
// jamais lisible par la page) et le profil public (sans le hash du mot de passe).
function startSession(res, profil) {
  const { motDePasse: _omit, ...publicProfil } = profil;
  setSessionCookie(res, profil.id);
  res.json({ profil: publicProfil });
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Hash factice comparé quand le compte n'existe pas, pour que la réponse prenne
// le même temps et ne révèle pas quelles adresses sont inscrites.
const DUMMY_HASH = bcrypt.hashSync("compte-inexistant", 10);

async function login(req, res) {
  const { mail, motDePasse } = validate(schemas.login, req.body);

  // Les adresses sont enregistrées en minuscules ; les comptes plus anciens
  // peuvent encore avoir la casse saisie à l'inscription.
  const profil = await prisma.profil.findFirst({ where: { mail: { in: [mail, mail.toLowerCase()] } } });
  const valid = await bcrypt.compare(motDePasse, profil?.motDePasse ?? DUMMY_HASH);
  if (!profil || !valid) throw new HttpError(401, "Identifiants invalides", "INVALID_CREDENTIALS");

  startSession(res, profil);
}

// Connexion via Google : vérifie le jeton d'identité auprès de Google, puis
// retrouve ou crée le profil correspondant à l'adresse mail du compte Google.
async function google(req, res) {
  const { credential } = req.body ?? {};
  if (!credential) throw new HttpError(400, "credential est requis", "VALIDATION_ERROR");
  if (!googleClient) throw new HttpError(500, "Connexion Google non configurée sur le serveur", "GOOGLE_NOT_CONFIGURED");

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, "Jeton Google invalide", "INVALID_GOOGLE_TOKEN");
  }

  const { email, email_verified, given_name, family_name } = payload;
  if (!email) throw new HttpError(400, "Email Google introuvable", "GOOGLE_EMAIL_MISSING");
  // Sans adresse vérifiée par Google, n'importe qui pourrait se connecter au
  // compte existant qui porte cette adresse.
  if (email_verified !== true) throw new HttpError(401, "Adresse Google non vérifiée", "GOOGLE_EMAIL_UNVERIFIED");

  const mail = email.toLowerCase();
  let profil = await prisma.profil.findUnique({ where: { mail } });
  if (!profil) {
    const randomHash = await bcrypt.hash(crypto.randomUUID(), 10);
    profil = await prisma.profil.create({
      data: {
        nom: family_name || "",
        prenom: given_name || "Utilisateur",
        mail,
        motDePasse: randomHash,
        role: "USER",
        // Le bouton Google est accompagné de la mention « En continuant, tu
        // acceptes les CGU et la politique de confidentialité ».
        cguAccepteesLe: new Date(),
      },
    });
  }

  startSession(res, profil);
}

// GET /api/auth/me — profil de la session en cours (401 si elle a expiré).
async function me(req, res) {
  const profil = await prisma.profil.findUnique({ where: { id: req.user.id }, select: PUBLIC_FIELDS });
  res.json({ profil });
}

async function logout(req, res) {
  clearSessionCookie(res);
  res.status(204).send();
}

module.exports = { login, google, me, logout };
