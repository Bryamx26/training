// Limite basse fixée AVANT d'importer l'API (lue au chargement).
process.env.AUTH_RATE_LIMIT = "3";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, stop, api } = require("./helpers");

before(start);
after(stop);

describe("limitation des tentatives", () => {
  it("bloque la connexion après trop d'échecs", async () => {
    const attempt = () => api("POST", "/auth/login", { body: { mail: "x@test.local", motDePasse: "mauvais!" } });
    for (let i = 0; i < 3; i++) assert.equal((await attempt()).status, 401);
    const blocked = await attempt();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, "TOO_MANY_REQUESTS");
  });

  it("limite les inscriptions publiques", async () => {
    const signup = (i) =>
      api("POST", "/profils", { body: { nom: "N", prenom: "P", mail: `spam-${i}@test.local`, motDePasse: "motdepasse", accepteCgu: true } });
    for (let i = 0; i < 3; i++) assert.equal((await signup(i)).status, 201);
    assert.equal((await signup(99)).status, 429);
  });
});
