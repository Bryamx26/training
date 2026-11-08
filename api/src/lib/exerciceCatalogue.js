// Exercices proposés par défaut dans le formulaire de séance, avec les muscles
// qu'ils travaillent (noms de la table muscles, voir database/seed.cjs). Le
// coach peut toujours saisir un nom libre (« Autre »), et les exercices qu'il a
// déjà utilisés s'ajoutent à ce catalogue (voir exercice.controller.js).
const MUSCLES_PAR_EXERCICE = {
  Burpees: ["Pectoraux", "Quadriceps", "Épaules"],
  "Corde à sauter": ["Mollets"],
  Crunchs: ["Abdominaux"],
  "Développé couché": ["Pectoraux", "Triceps", "Épaules"],
  "Développé militaire": ["Épaules", "Triceps"],
  Dips: ["Triceps", "Pectoraux"],
  Fentes: ["Quadriceps", "Fessiers"],
  Gainage: ["Abdominaux"],
  "Gainage latéral": ["Abdominaux"],
  "Hip thrust": ["Fessiers", "Ischio-jambiers"],
  "Jumping jacks": ["Mollets", "Épaules"],
  "Montées de genoux": ["Quadriceps", "Abdominaux"],
  "Mountain climbers": ["Abdominaux", "Épaules"],
  Pompes: ["Pectoraux", "Triceps", "Épaules"],
  Rameur: ["Dos", "Quadriceps", "Biceps"],
  "Rowing haltère": ["Dos", "Biceps"],
  "Soulevé de terre": ["Ischio-jambiers", "Dos", "Fessiers"],
  Squat: ["Quadriceps", "Fessiers"],
  "Squat sauté": ["Quadriceps", "Fessiers", "Mollets"],
  Tractions: ["Dos", "Biceps"],
};

const BASE_CATALOGUE = Object.keys(MUSCLES_PAR_EXERCICE);

const byLowerName = new Map(Object.entries(MUSCLES_PAR_EXERCICE).map(([nom, muscles]) => [nom.toLowerCase(), muscles]));

// Muscles par défaut d'un exercice du catalogue (insensible à la casse), [] sinon.
function defaultMuscles(nom) {
  return byLowerName.get(nom.trim().toLowerCase()) ?? [];
}

module.exports = { BASE_CATALOGUE, defaultMuscles };
