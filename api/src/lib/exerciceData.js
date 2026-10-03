const HttpError = require("./httpError");

// Validation des données d'un exercice (template ou séance) envoyées par le
// client. Renvoie un objet prêt pour Prisma, ou lance une 400 explicite.

const TEXT_FIELDS = ["description", "consignes", "objectif", "tempo", "amplitude", "url"];
const INT_FIELDS = ["series", "nbRep", "duree", "tempsDeRepos"];
const TYPES = ["FORCE", "ENDURANCE", "HYPERTROPHIE", "FIGURE"];

function invalid(message) {
  return new HttpError(400, message, "VALIDATION_ERROR");
}

// Texte optionnel : chaîne non vide ou null.
function optionalText(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw invalid(`${field} doit être un texte`);
  return value.trim() || null;
}

function optionalNumber(value, field, { integer }) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || (integer && !Number.isInteger(n))) {
    throw invalid(`${field} doit être un nombre ${integer ? "entier " : ""}positif`);
  }
  return n;
}

// Nom obligatoire : exercice du catalogue ou nom libre saisi par le coach (« Autre »).
function requiredName(value, field) {
  if (typeof value !== "string" || !value.trim()) throw invalid(`${field} est requis`);
  return value.trim();
}

// Le type de séance est optionnel dans un template, mais doit être connu.
function optionalType(value) {
  if (value === undefined || value === null || value === "") return null;
  if (!TYPES.includes(value)) throw invalid(`type doit valoir ${TYPES.join(", ")}`);
  return value;
}

function parseExercice(raw, ordre) {
  if (!raw || typeof raw !== "object") throw invalid("Chaque exercice doit être un objet");
  const data = { exercice: requiredName(raw.exercice, "Le nom de l'exercice"), ordre };
  for (const field of TEXT_FIELDS) data[field] = optionalText(raw[field], field);
  for (const field of INT_FIELDS) data[field] = optionalNumber(raw[field], field, { integer: true });
  data.lest = optionalNumber(raw.lest, "lest", { integer: false });
  return data;
}

module.exports = { parseExercice, requiredName, optionalText, optionalType, invalid };
