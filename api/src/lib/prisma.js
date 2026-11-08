const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../database/.env") });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// SQLite en mode WAL : les lectures ne sont plus bloquées pendant une écriture,
// et les écritures attendent le verrou au lieu d'échouer (socket_timeout de
// Prisma, 5 s par défaut). Le mode est enregistré dans le fichier de la base :
// cette requête ne fait que le confirmer aux démarrages suivants.
prisma
  .$queryRawUnsafe("PRAGMA journal_mode = WAL;")
  .catch((err) => console.error("Mode WAL de SQLite non activé", err));

module.exports = prisma;
