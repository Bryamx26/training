// Adresse de l'API, fixée à la compilation (VITE_API_URL, ex.
// "https://api-sport-track.mon-domaine.fr"). Vide : même origine que le front
// (proxy Vite en dev, nginx sinon).
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

// Build locale (VITE_API_URL=http://localhost:4000) ouverte depuis un autre
// appareil du réseau (http://192.168.x.x) : "localhost" désignerait cet
// appareil. On garde le protocole et le port de l'API, mais on vise la machine
// qui a servi le front.
export function resolveApiOrigin(configured, pageHostname) {
  const origin = (configured || "").replace(/\/+$/, "");
  if (!origin || !pageHostname || LOCAL_HOSTS.includes(pageHostname)) return origin;
  try {
    const url = new URL(origin);
    if (!LOCAL_HOSTS.includes(url.hostname)) return origin;
    url.hostname = pageHostname;
    return url.origin;
  } catch {
    return origin;
  }
}

const API_ORIGIN = resolveApiOrigin(
  import.meta.env.VITE_API_URL,
  typeof window !== "undefined" ? window.location.hostname : "",
);
const BASE_URL = `${API_ORIGIN}/api`;

// URL complète d'une route de l'API, pour les liens directs (téléchargements…).
export const apiUrl = (path) => `${BASE_URL}${path}`;

// La session est portée par un cookie httpOnly posé par l'API : le navigateur
// l'envoie tout seul et le JavaScript de la page n'y a jamais accès.
let onSessionExpired = () => {};

// Appelé quand l'API refuse la session (expirée, compte supprimé…).
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  // "include" : le cookie de session est envoyé aussi quand l'API est sur un
  // autre sous-domaine (l'API doit alors autoriser le front dans CORS_ORIGIN).
  const res = await fetch(apiUrl(path), { ...options, headers, credentials: "include" });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // SESSION_EXPIRED / UNAUTHENTICATED = plus de session valide. Un 401 de
    // connexion (mauvais mot de passe) est une erreur normale à afficher.
    if (res.status === 401 && ["SESSION_EXPIRED", "UNAUTHENTICATED"].includes(data?.code)) onSessionExpired();
    // `code` : identifiant métier renvoyé par l'API (ex. "ATHLETE_NOT_SUBSCRIBED").
    throw Object.assign(new Error(data?.error || `Erreur ${res.status}`), { status: res.status, code: data?.code });
  }
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) });
const del = (path) => request(path, { method: "DELETE" });

export const auth = {
  login: (mail, motDePasse) => post("/auth/login", { mail, motDePasse }),
  google: (credential) => post("/auth/google", { credential }),
  me: () => get("/auth/me"),
  logout: () => post("/auth/logout"),
};

export const profils = {
  list: () => get("/profils"),
  demandesCoach: () => get("/profils?demandeCoach=true"),
  get: (id) => get(`/profils/${id}`),
  create: (data) => post("/profils", data),
  update: (id, data) => put(`/profils/${id}`, data),
  remove: (id) => del(`/profils/${id}`),
};

export const circuits = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/circuits${qs ? `?${qs}` : ""}`);
  },
  get: (id) => get(`/circuits/${id}`),
  // Chiffres du tableau de bord du coach (séances, à venir, progression, 3 prochaines).
  // `depuis` : début de la journée sur l'appareil, pour « à venir ».
  resume: () => get(`/circuits/resume?${new URLSearchParams({ depuis: new Date(new Date().toDateString()).toISOString() })}`),
  create: (data) => post("/circuits", data),
  update: (id, data) => put(`/circuits/${id}`, data),
  remove: (id) => del(`/circuits/${id}`),
  setParticipants: (id, participantIds) => put(`/circuits/${id}/participants`, { participantIds }),
  // Ce que le participant connecté a réellement fait (séries, charges).
  saveRealisation: (id, data) => put(`/circuits/${id}/realisation`, data),
};

export const exercices = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/exercices${qs ? `?${qs}` : ""}`);
  },
  create: (data) => post("/exercices", data),
  update: (id, data) => put(`/exercices/${id}`, data),
  remove: (id) => del(`/exercices/${id}`),
  grade: (id, profilId, data) => put(`/exercices/${id}/notes/${profilId}`, data),
  // Exercices proposés dans le formulaire : catalogue de base + ceux déjà utilisés par le coach.
  catalogue: () => get("/exercices/catalogue"),
};

// Templates de séance du coach connecté.
export const templates = {
  list: () => get("/templates"),
  get: (id) => get(`/templates/${id}`),
  create: (data) => post("/templates", data),
  update: (id, data) => put(`/templates/${id}`, data),
  remove: (id) => del(`/templates/${id}`),
};

export const coaches = {
  search: (search = "") => get(`/coaches?${new URLSearchParams({ search })}`),
  get: (id) => get(`/coaches/${id}`),
  subscribe: (id) => post(`/coaches/${id}/subscribe`),
  unsubscribe: (id) => patch(`/coaches/${id}/subscribe`, { status: "cancelled" }),
};

// Données propres à l'utilisateur connecté.
export const me = {
  coaches: () => get("/me/coaches"),
  subscribers: () => get("/me/subscribers"),
  // Le coach retire un sportif de ses abonnés (le compte est conservé).
  removeSubscriber: (athleteId) => del(`/me/subscribers/${athleteId}`),
  // Acceptation des CGU (compte créé par un coach, première connexion).
  acceptCgu: () => post("/me/cgu"),
  notifications: () => get("/me/notifications"),
  // Sans `ids`, marque toutes les notifications comme lues.
  markNotificationsRead: (ids) => post("/me/notifications/read", ids ? { ids } : {}),
};

// Statistiques d'entraînement (soi-même par défaut, ou un sportif suivi).
export const stats = {
  muscles: (params = {}) => get(`/stats/muscles?${new URLSearchParams(params)}`),
  exercices: (params = {}) => get(`/stats/exercices?${new URLSearchParams(params)}`),
};

export const muscles = {
  list: () => get("/muscles"),
};
