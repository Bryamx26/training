// Test de charge de l'API Sport Track : visiteurs virtuels par paliers.
// Usage : DATABASE_URL="file:/chemin/loadtest.db" node loadtest/run.mjs <dossier-résultats>
// (base préparée par loadtest/seed.cjs). Lance l'API sur un port dédié, suit
// son CPU et sa mémoire, et écrit results.json dans le dossier donné.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? ".";
mkdirSync(OUT, { recursive: true });
const PORT = 4200;
const BASE = `http://127.0.0.1:${PORT}/api`;
const STAGES = (process.env.STAGES ?? "10,50,100,200,400").split(",").map(Number);
const STAGE_S = Number(process.env.STAGE_S ?? 30);
const THINK = [300, 900]; // pause entre deux actions d'un visiteur (ms)
const TIMEOUT_MS = 10000;
const COACH_EVERY = 20; // 1 visiteur sur 20 est un coach
const PASSWORD = "charge1234";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

// --- API sous test -------------------------------------------------------
const root = new URL("../", import.meta.url).pathname;
const api = spawn("node", ["src/index.js"], {
  cwd: join(root, "api"),
  env: { ...process.env, PORT: String(PORT), JWT_SECRET: "charge-test", AUTH_RATE_LIMIT: "1000000", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverErrors = 0;
const serverErrorSamples = [];
api.stderr.on("data", (d) => {
  serverErrors++;
  if (serverErrorSamples.length < 5) serverErrorSamples.push(String(d).slice(0, 400));
});
for (let i = 0; i < 100; i++) {
  try {
    await fetch(`${BASE}/auth/me`);
    break;
  } catch {
    await sleep(100);
  }
}

// --- Mesures -------------------------------------------------------------
const t0 = Date.now();
let stage = 0;
let activeVUs = 0;
const samples = []; // { t, stage, name, ms, status }
const errorSamples = [];
const system = []; // { t, cpu, rssMb, vus }

async function call(name, path, { method = "GET", body, cookie } = {}) {
  const start = performance.now();
  let status = 0;
  let data = null;
  let headers = null;
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    status = res.status;
    headers = res.headers;
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    status = err.name === "TimeoutError" ? -1 : 0;
    data = { error: err.message };
  }
  const ms = performance.now() - start;
  samples.push({ t: (Date.now() - t0) / 1000, stage, name, ms, status });
  if ((status < 200 || status >= 400) && errorSamples.length < 30) errorSamples.push({ name, status, stage: STAGES[stage], body: JSON.stringify(data).slice(0, 200) });
  return { status, data, headers };
}

async function login(mail) {
  const r = await call("POST /auth/login", "/auth/login", { method: "POST", body: { mail, motDePasse: PASSWORD } });
  const set = r.headers?.get("set-cookie") ?? "";
  return { cookie: set.split(";")[0], profil: r.data?.profil };
}

// --- Parcours ------------------------------------------------------------
let running = true;
const think = () => sleep(rand(...THINK));

async function athlete(n) {
  const { cookie, profil } = await login(`sportif${n}@charge.local`);
  if (!profil) return;
  while (running) {
    await call("GET /auth/me", "/auth/me", { cookie });
    await think();
    const list = await call("GET /circuits (sportif)", `/circuits?profilId=${profil.id}`, { cookie });
    await think();
    await call("GET /me/notifications", "/me/notifications", { cookie });
    await think();
    const today = Array.isArray(list.data) ? list.data.find((c) => c.nom === "Séance du jour") : null;
    if (today) {
      const detail = await call("GET /circuits/:id", `/circuits/${today.id}`, { cookie });
      await think();
      const exercices = detail.data?.exercices ?? [];
      const series = exercices.flatMap((ex) =>
        Array.from({ length: ex.series || 1 }, (_, i) => ({ exerciceId: ex.id, serie: i + 1, reps: ex.nbRep, lest: ex.lest, duree: ex.duree }))
      );
      await call("PUT /circuits/:id/realisation", `/circuits/${today.id}/realisation`, { method: "PUT", body: { series }, cookie });
      await think();
    }
    await call("GET /stats/muscles", "/stats/muscles", { cookie });
    await think();
    await call("GET /stats/exercices", "/stats/exercices", { cookie });
    await think();
  }
}

async function coach(n) {
  const { cookie, profil } = await login(`coach${(n % 4) + 1}@charge.local`);
  if (!profil) return;
  while (running) {
    const subs = await call("GET /me/subscribers", "/me/subscribers", { cookie });
    await think();
    await call("GET /circuits (coach)", "/circuits", { cookie });
    await think();
    const athleteId = Array.isArray(subs.data) && subs.data.length ? subs.data[Math.floor(Math.random() * subs.data.length)].id : null;
    if (athleteId) {
      const created = await call("POST /circuits", "/circuits", {
        method: "POST",
        cookie,
        body: {
          nom: "Séance charge",
          type: "FORCE",
          date: new Date(Date.now() + 2 * 864e5).toISOString(),
          participantIds: [athleteId],
          exercices: [
            { exercice: "Squat", series: 4, nbRep: 10, lest: 50 },
            { exercice: "Pompes", series: 3, nbRep: 12 },
            { exercice: "Gainage", duree: 45 },
          ],
        },
      });
      await think();
      const ex = created.data?.exercices?.[0];
      if (ex) {
        await call("PUT /exercices/:id/notes/:profilId", `/exercices/${ex.id}/notes/${athleteId}`, { method: "PUT", cookie, body: { note: 8, commentaire: "RAS" } });
        await think();
      }
      await call("GET /stats/exercices (coach)", `/stats/exercices?profilId=${athleteId}`, { cookie });
      await think();
    }
  }
}

// --- Suivi CPU / mémoire de l'API (via /proc) -----------------------------
const CLK = 100;
let lastCpu = null;
const sysTimer = setInterval(() => {
  try {
    const stat = readFileSync(`/proc/${api.pid}/stat`, "utf8").split(") ")[1].split(" ");
    const cpuTicks = Number(stat[11]) + Number(stat[12]);
    const rss = Number(/VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${api.pid}/status`, "utf8"))[1]) / 1024;
    const now = Date.now();
    if (lastCpu) system.push({ t: (now - t0) / 1000, cpu: ((cpuTicks - lastCpu.ticks) / CLK / ((now - lastCpu.at) / 1000)) * 100, rssMb: rss, vus: activeVUs });
    lastCpu = { ticks: cpuTicks, at: now };
  } catch {}
}, 1000);

// --- Paliers -------------------------------------------------------------
const vus = [];
let next = 1;
const stageBounds = [];
for (let s = 0; s < STAGES.length; s++) {
  stage = s;
  const start = (Date.now() - t0) / 1000;
  const target = STAGES[s];
  console.log(`palier ${s + 1}/${STAGES.length} : ${target} visiteurs`);
  const toAdd = target - activeVUs;
  for (let i = 0; i < toAdd; i++) {
    const n = next++;
    activeVUs++;
    vus.push(n % COACH_EVERY === 0 ? coach(n) : athlete(n));
    await sleep((3000 / toAdd) | 0); // montée progressive sur ~3 s
  }
  await sleep(STAGE_S * 1000 - 3000);
  stageBounds.push({ vus: target, start, end: (Date.now() - t0) / 1000 });
}
running = false;
await Promise.race([Promise.all(vus), sleep(TIMEOUT_MS + 2000)]);
clearInterval(sysTimer);
api.kill();

// --- Synthèse -------------------------------------------------------------
const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const summarize = (list, seconds) => {
  const ms = list.map((x) => x.ms);
  const errors = list.filter((x) => x.status < 200 || x.status >= 400).length;
  return {
    count: list.length,
    rps: seconds ? list.length / seconds : null,
    errors,
    errorRate: list.length ? errors / list.length : 0,
    p50: pct(ms, 50),
    p95: pct(ms, 95),
    p99: pct(ms, 99),
    max: ms.length ? Math.max(...ms) : null,
  };
};
const routes = [...new Set(samples.map((x) => x.name))];
const stages = stageBounds.map((b, i) => {
  const inStage = samples.filter((x) => x.stage === i);
  const secs = b.end - b.start;
  const sys = system.filter((x) => x.t >= b.start && x.t < b.end);
  return {
    vus: b.vus,
    seconds: secs,
    overall: summarize(inStage, secs),
    cpuAvg: sys.length ? sys.reduce((a, x) => a + x.cpu, 0) / sys.length : null,
    cpuMax: sys.length ? Math.max(...sys.map((x) => x.cpu)) : null,
    rssMax: sys.length ? Math.max(...sys.map((x) => x.rssMb)) : null,
    routes: Object.fromEntries(routes.map((r) => [r, summarize(inStage.filter((x) => x.name === r), secs)])),
  };
});
const timeline = [];
const end = Math.ceil(Math.max(...samples.map((x) => x.t), 0));
for (let sec = 0; sec < end; sec++) {
  const inSec = samples.filter((x) => x.t >= sec && x.t < sec + 1);
  const sys = system.find((x) => Math.floor(x.t) === sec);
  timeline.push({
    t: sec,
    rps: inSec.length,
    p50: pct(inSec.map((x) => x.ms), 50),
    p95: pct(inSec.map((x) => x.ms), 95),
    errors: inSec.filter((x) => x.status < 200 || x.status >= 400).length,
    cpu: sys?.cpu ?? null,
    rssMb: sys?.rssMb ?? null,
    vus: sys?.vus ?? null,
  });
}
const result = {
  date: new Date().toISOString(),
  config: { stages: STAGES, stageSeconds: STAGE_S, thinkMs: THINK, timeoutMs: TIMEOUT_MS, coachShare: 1 / COACH_EVERY },
  totals: summarize(samples, (Date.now() - t0) / 1000),
  stages,
  timeline,
  errorSamples,
  serverErrors,
  serverErrorSamples,
};
writeFileSync(join(OUT, "results.json"), JSON.stringify(result, null, 2));
console.log("\npalier | visiteurs | req/s | p50 | p95 | p99 | erreurs | CPU moy | RSS max");
for (const s of stages) {
  const o = s.overall;
  console.log(
    [s.vus, o.rps.toFixed(0), o.p50?.toFixed(0) + " ms", o.p95?.toFixed(0) + " ms", o.p99?.toFixed(0) + " ms", `${o.errors} (${(o.errorRate * 100).toFixed(1)} %)`, s.cpuAvg?.toFixed(0) + " %", s.rssMax?.toFixed(0) + " Mo"].join(" | ")
  );
}
console.log(`\nrésultats : ${join(OUT, "results.json")}`);
process.exit(0);
