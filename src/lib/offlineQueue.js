import { circuits as circuitsApi } from "./api";

// Réalisations de séance enregistrées hors connexion : gardées dans le
// navigateur et renvoyées dès que le réseau revient (ou au prochain lancement).
// Chaque saisie est liée au profil qui l'a faite : elle n'est envoyée qu'avec
// la session de ce même compte, jamais avec celle d'un autre utilisateur de
// l'appareil. Élément : { profilId, circuitId, data }.
const KEY = "realisations-en-attente";

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY)) ?? [];
    // Saisies de l'ancienne version, sans profilId : null.
    return items.map((item) => ({ profilId: null, ...item }));
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

const sameSeance = (a, b) => a.profilId === b.profilId && a.circuitId === b.circuitId;
const sameItem = (a, b) => sameSeance(a, b) && JSON.stringify(a.data) === JSON.stringify(b.data);

// Une erreur sans statut HTTP vient du réseau (fetch rejeté), pas de l'API.
export function isNetworkError(err) {
  return err instanceof TypeError || err?.status === undefined;
}

// Refus définitif de l'API (données invalides, plus participant, séance
// supprimée…) : inutile de réessayer. Une session expirée (401), une limite
// (429) ou une panne du serveur (5xx) sont passagères : la saisie est gardée.
export function isDefinitiveRefusal(err) {
  return !isNetworkError(err) && err.status >= 400 && err.status < 500 && ![401, 408, 429].includes(err.status);
}

// Enregistre la réalisation, ou la met en attente si l'envoi échoue pour une
// raison passagère. Renvoie "saved" ou "queued" ; un refus définitif est relancé.
export async function saveRealisation(profilId, circuitId, data) {
  try {
    await circuitsApi.saveRealisation(circuitId, data);
    return "saved";
  } catch (err) {
    if (isDefinitiveRefusal(err)) throw err;
    const item = { profilId, circuitId, data };
    // Une seule saisie par séance et par compte : la plus récente remplace l'ancienne.
    write([...read().filter((i) => !sameSeance(i, item)), item]);
    return "queued";
  }
}

// Nombre de saisies en attente pour ce profil (toutes sans profilId).
export function pendingCount(profilId) {
  const items = read();
  return profilId === undefined ? items.length : items.filter((i) => i.profilId === profilId || i.profilId === null).length;
}

let flushing = null;

// Renvoie les saisies en attente du profil connecté (et celles de l'ancienne
// version, sans profil). Les refus définitifs sont abandonnés ; les échecs
// passagers restent en file. Renvoie le nombre de saisies de ce profil encore
// en attente. Un seul envoi à la fois.
export function flushQueue(profilId) {
  if (!profilId) return Promise.resolve(pendingCount(profilId));
  if (flushing) return flushing;
  flushing = (async () => {
    const done = [];
    for (const item of read().filter((i) => i.profilId === profilId || i.profilId === null)) {
      try {
        await circuitsApi.saveRealisation(item.circuitId, item.data);
        done.push(item);
      } catch (err) {
        if (isDefinitiveRefusal(err)) done.push(item);
      }
    }
    // Relit la file : une saisie ajoutée pendant l'envoi ne doit pas être écrasée.
    write(read().filter((i) => !done.some((d) => sameItem(d, i))));
    return pendingCount(profilId);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
