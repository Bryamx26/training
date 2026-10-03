const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");
const { signToken } = require("../lib/token");

// Réponse commune aux deux modes de connexion : le jeton de session et le
// profil public (sans le hash du mot de passe).
function sessionResponse(profil) {
  const { motDePasse: _omit, ...publicProfil } = profil;
  return { token: signToken(profil.id), profil: publicProfil };
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function login(req, res) {
  const { mail, motDePasse } = req.body;
  if (!mail || !motDePasse) {
    return res.status(400).json({ error: "mail et motDePasse sont requis" });
  }

  const profil = await prisma.profil.findUnique({ where: { mail } });
  if (!profil) return res.status(401).json({ error: "Identifiants invalides" });

  const valid = await bcrypt.compare(motDePasse, profil.motDePasse);
  if (!valid) return res.status(401).json({ error: "Identifiants invalides" });

  res.json(sessionResponse(profil));
}

// Connexion via Google : vérifie le jeton d'identité auprès de Google, puis
// retrouve ou crée le profil correspondant à l'adresse mail du compte Google.
async function google(req, res) {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "credential est requis" });
  if (!googleClient) return res.status(500).json({ error: "Connexion Google non configurée sur le serveur" });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Jeton Google invalide" });
  }

  const { email, given_name, family_name } = payload;
  if (!email) return res.status(400).json({ error: "Email Google introuvable" });

  let profil = await prisma.profil.findUnique({ where: { mail: email } });
  if (!profil) {
    const randomHash = await bcrypt.hash(crypto.randomUUID(), 10);
    profil = await prisma.profil.create({
      data: {
        nom: family_name || "",
        prenom: given_name || "Utilisateur",
        mail: email,
        motDePasse: randomHash,
        role: "USER",
      },
    });
  }

  res.json(sessionResponse(profil));
}

module.exports = { login, google };
