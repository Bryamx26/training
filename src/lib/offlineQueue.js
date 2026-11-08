import { circuits as circuitsApi } from "./api";

// Réalisations de séance enregistrées hors connexion : gardées dans le
// navigateur et renvoyées dès que le réseau revient (ou au prochain lancement).
const KEY = "realisations-en-attente";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    if (items.length) localStorage.setItem(KEY, JSON.stringify(items));
    else localStorage.removeItem(KEY);
  } catch {
    // Stockage indisponible : la saisie est perdue, comme sans file d'attente.
  }
}

// Une erreur sans statut HTTP vient du réseau (fetch rejeté), pas de l'API.
export function isNetworkError(err) {
  return err instanceof TypeError || err?.status === undefined;
}

// Enregistre la réalisation, ou la met en attente si le réseau manque.
// Renvoie "saved" ou "queued" ; une erreur de l'API (400, 403…) est relancée.
export async function saveRealisation(circuitId, data) {
  try {
    await circuitsApi.saveRealisation(circuitId, data);
    return "saved";
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    // Une seule saisie par séance : la plus récente remplace l'ancienne.
    write([...read().filter((item) => item.circuitId !== circuitId), { circuitId, data }]);
    return "queued";
  }
}

export function pendingCount() {
  return read().length;
}

// Renvoie les saisies en attente. Celles refusées par l'API sont abandonnées ;
// celles qui échouent encore faute de réseau restent en file.
export async function flushQueue() {
  const remaining = [];
  for (const item of read()) {
    try {
      await circuitsApi.saveRealisation(item.circuitId, item.data);
    } catch (err) {
      if (isNetworkError(err)) remaining.push(item);
    }
  }
  write(remaining);
  return remaining.length;
}
