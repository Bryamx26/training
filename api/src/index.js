const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profilRoutes = require("./routes/profil.routes");
const circuitRoutes = require("./routes/circuit.routes");
const exerciceRoutes = require("./routes/exercice.routes");
const muscleRoutes = require("./routes/muscle.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profils", profilRoutes);
app.use("/api/circuits", circuitRoutes);
app.use("/api/exercices", exerciceRoutes);
app.use("/api/muscles", muscleRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === "P2025") return res.status(404).json({ error: "Ressource introuvable" });
  if (err.code === "P2002") return res.status(409).json({ error: "Valeur déjà utilisée (contrainte unique)" });
  if (err.code === "P2003") return res.status(409).json({ error: "Opération refusée : contrainte de clé étrangère" });

  res.status(err.status || 500).json({ error: err.message || "Erreur serveur" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API sport en écoute sur http://localhost:${PORT}`);
});
