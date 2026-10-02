const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`);
  }
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
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
};

export const muscles = {
  list: () => get("/muscles"),
};
