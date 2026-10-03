// Environnement de test : base SQLite temporaire, migrée avec les vraies
// migrations Prisma, et API démarrée sur un port libre.
// Doit être importé AVANT tout module de l'API (qui lit DATABASE_URL au chargement).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sport-api-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;
process.env.JWT_SECRET = "secret-de-test";

execSync("npx prisma migrate deploy --schema=../database/schema.prisma", {
  cwd: path.join(__dirname, ".."),
  env: process.env,
  stdio: "ignore",
});

const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { signToken } = require("../src/lib/token");

let server;
let baseUrl;

async function start() {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  process.env.TEST_API_URL = baseUrl;
}

async function stop() {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  fs.rmSync(dir, { recursive: true, force: true });
}

// Crée un profil directement en base et renvoie { ...profil, token }.
let counter = 0;
async function createUser(role, prenom = role.toLowerCase()) {
  counter += 1;
  const profil = await prisma.profil.create({
    data: { nom: "Test", prenom, mail: `${prenom}-${counter}@test.local`, motDePasse: "x", role },
  });
  return { ...profil, token: signToken(profil.id) };
}

// Appel HTTP à l'API. Renvoie { status, body }.
async function api(method, url, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Crée une séance appartenant à `coach`, éventuellement avec des participants (en base, sans contrôle).
function createCircuit(coach, participantIds = []) {
  return prisma.circuit.create({
    data: {
      nom: "Séance test",
      type: "FORCE",
      date: new Date(),
      auteurId: coach.id,
      personnes: { create: participantIds.map((profilId) => ({ profilId })) },
    },
  });
}

module.exports = { start, stop, createUser, api, createCircuit, prisma };
