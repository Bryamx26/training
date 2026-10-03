// Conversion entre les exercices de l'API (séance ou template) et l'état du
// formulaire, où toutes les valeurs sont des chaînes éditables.

export const DIFFICULTES = ["Débutant", "Intermédiaire", "Avancé", "Expert"];

export const TYPES = [
  { value: "FORCE", label: "Force" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "HYPERTROPHIE", label: "Hypertrophie" },
  { value: "FIGURE", label: "Figure" },
];

export const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

const PARAMS = ["description", "consignes", "objectif", "series", "nbRep", "duree", "tempsDeRepos", "lest"];

// Clé React stable : deux exercices peuvent porter le même nom.
let nextKey = 0;
function newKey() {
  nextKey += 1;
  return `ex-${nextKey}`;
}

// Nouvel exercice, éventuellement pré-rempli (entrée du catalogue, exercice d'un template…).
export function exerciceDraft(source = {}) {
  const draft = { key: newKey(), exercice: source.exercice ?? "" };
  for (const field of PARAMS) draft[field] = source[field] ?? "";
  // État d'interface (non envoyé à l'API) : le champ de lest est affiché.
  draft.avecLest = draft.lest !== "";
  return draft;
}

// Exercice existant d'une séance : garde son id pour le mettre à jour plutôt que le recréer.
export function exerciceFromApi(ex) {
  return { ...exerciceDraft(ex), id: ex.id };
}

export function exerciceToApi(ex, ordre) {
  const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));
  return {
    exercice: ex.exercice.trim(),
    description: ex.description || undefined,
    consignes: ex.consignes || undefined,
    objectif: ex.objectif || undefined,
    series: num(ex.series),
    nbRep: num(ex.nbRep),
    duree: num(ex.duree),
    tempsDeRepos: num(ex.tempsDeRepos),
    // Lest en kg (virgule acceptée). null, pas undefined : retirer le lest d'un
    // exercice existant doit l'effacer en base.
    lest: ex.lest === "" || ex.lest === null || ex.lest === undefined ? null : Number(String(ex.lest).replace(",", ".")),
    ordre,
  };
}

// « 10 kg », « 2,5 kg » : lest affiché, ou null si l'exercice n'est pas lesté.
export function formatLest(lest) {
  if (lest === null || lest === undefined || lest === "") return null;
  return `${String(lest).replace(".", ",")} kg`;
}

export function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Résumé « Avancé · 4 exercices » d'un template ou d'une séance.
export function contentSummary({ niveau, exercicesCount }) {
  const count = `${exercicesCount} exercice${exercicesCount > 1 ? "s" : ""}`;
  return niveau ? `${niveau} · ${count}` : count;
}
