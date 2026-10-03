const BASE_URL = "/api";

// Jeton de session envoyé à chaque requête. Il est fourni par AuthContext,
// qui gère aussi sa persistance.
let authToken = null;
let onSessionExpired = () => {};

export function setAuthToken(token) {
  authToken = token;
}

// Appelé quand l'API refuse un jeton (expiré, compte supprimé…).
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Un 401 avec un jeton = session invalide. Sans jeton (ex. mauvais mot de
    // passe à la connexion), c'est une erreur normale à afficher.
    if (res.status === 401 && authToken) onSessionExpired();
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
};

export const profils = {
  list: () => get("/profils"),
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
  create: (data) => post("/circuits", data),
  update: (id, data) => put(`/circuits/${id}`, data),
  remove: (id) => del(`/circuits/${id}`),
  setParticipants: (id, participantIds) => put(`/circuits/${id}/participants`, { participantIds }),
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
};

export const muscles = {
  list: () => get("/muscles"),
};
