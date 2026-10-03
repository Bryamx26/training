const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profilRoutes = require("./routes/profil.routes");
const circuitRoutes = require("./routes/circuit.routes");
const exerciceRoutes = require("./routes/exercice.routes");
const muscleRoutes = require("./routes/muscle.routes");
const coachRoutes = require("./routes/coach.routes");
const meRoutes = require("./routes/me.routes");
const templateRoutes = require("./routes/template.routes");
const HttpError = require("./lib/httpError");

// Application Express, sans démarrage du serveur : src/index.js l'écoute sur
// un port, les tests (test/) la démarrent sur un port libre.
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profils", profilRoutes);
app.use("/api/circuits", circuitRoutes);
app.use("/api/exercices", exerciceRoutes);
app.use("/api/muscles", muscleRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/me", meRoutes);
app.use("/api/templates", templateRoutes);

// Documentation de l'API (OpenAPI 3).
app.get("/api/openapi.yaml", (req, res) => res.sendFile(path.join(__dirname, "../openapi.yaml")));

app.use((err, req, res, next) => {
  // Refus attendus (401, 403, 404…) : réponse directe, sans trace dans les logs.
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });

  console.error(err);

  if (err.code === "P2025") return res.status(404).json({ error: "Ressource introuvable" });
  if (err.code === "P2002") return res.status(409).json({ error: "Valeur déjà utilisée (contrainte unique)" });
  if (err.code === "P2003") return res.status(409).json({ error: "Opération refusée : contrainte de clé étrangère" });

  res.status(err.status || 500).json({ error: err.message || "Erreur serveur" });
});

module.exports = app;
