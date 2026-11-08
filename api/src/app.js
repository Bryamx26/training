const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const profilRoutes = require("./routes/profil.routes");
const circuitRoutes = require("./routes/circuit.routes");
const exerciceRoutes = require("./routes/exercice.routes");
const muscleRoutes = require("./routes/muscle.routes");
const coachRoutes = require("./routes/coach.routes");
const meRoutes = require("./routes/me.routes");
const templateRoutes = require("./routes/template.routes");
const statsRoutes = require("./routes/stats.routes");
const HttpError = require("./lib/httpError");

// Application Express, sans démarrage du serveur : src/index.js l'écoute sur
// un port, les tests (test/) la démarrent sur un port libre.
const app = express();

// Derrière un reverse proxy (nginx en production), TRUST_PROXY=1 permet de lire
// la vraie IP du client (limitation des tentatives de connexion).
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(helmet());
// Le front appelle l'API sur la même origine (proxy Vite / nginx) : aucune
// origine externe n'est autorisée, sauf celles listées dans CORS_ORIGIN.
const corsOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : false, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/profils", profilRoutes);
app.use("/api/circuits", circuitRoutes);
app.use("/api/exercices", exerciceRoutes);
app.use("/api/muscles", muscleRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/me", meRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/stats", statsRoutes);

// Documentation de l'API (OpenAPI 3).
app.get("/api/openapi.yaml", (req, res) => res.sendFile(path.join(__dirname, "../openapi.yaml")));

app.use("/api", (req, res) => res.status(404).json({ error: "Route introuvable", code: "NOT_FOUND" }));

app.use((err, req, res, _next) => {
  // Refus attendus (401, 403, 404…) : réponse directe, sans trace dans les logs.
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });

  // JSON mal formé envoyé par le client.
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON invalide", code: "INVALID_JSON" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Requête trop volumineuse", code: "PAYLOAD_TOO_LARGE" });

  if (err.code === "P2025") return res.status(404).json({ error: "Ressource introuvable", code: "NOT_FOUND" });
  if (err.code === "P2002") return res.status(409).json({ error: "Valeur déjà utilisée (contrainte unique)", code: "CONFLICT" });
  if (err.code === "P2003") return res.status(409).json({ error: "Opération refusée : contrainte de clé étrangère", code: "FOREIGN_KEY" });
  // Dernier filet : une valeur mal formée qui aurait échappé à la validation.
  // Le message de Prisma (détail du schéma) n'est jamais renvoyé au client.
  if (err.name === "PrismaClientValidationError") {
    console.error(err);
    return res.status(400).json({ error: "Requête invalide", code: "VALIDATION_ERROR" });
  }

  console.error(err);
  // En production, le détail d'une erreur inattendue n'est pas renvoyé au client.
  const message = process.env.NODE_ENV === "production" ? "Erreur serveur" : err.message || "Erreur serveur";
  res.status(err.status || 500).json({ error: message, code: "SERVER_ERROR" });
});

module.exports = app;
