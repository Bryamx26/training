const { z } = require("zod");
const HttpError = require("./httpError");

// Validation des corps de requête avec zod. Une erreur devient une 400
// { code: "VALIDATION_ERROR" } dont le message nomme le premier champ fautif.

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue.path.join(".");
  throw new HttpError(400, field ? `${field} : ${issue.message}` : issue.message, "VALIDATION_ERROR");
}

// Champ optionnel : "" et null valent null (effacer la valeur), undefined = non envoyé.
const emptyToNull = (v) => (v === "" ? null : v);
const nullable = (schema) => z.preprocess(emptyToNull, schema.nullable().optional());

const id = z.coerce.number({ error: "doit être un identifiant" }).int().positive();
const text = (max) => z.string({ error: "doit être un texte" }).trim().max(max, `${max} caractères maximum`);
const requiredText = (max) => text(max).min(1, "est requis");
const number = (min, max) =>
  z.coerce.number({ error: "doit être un nombre" }).min(min, `doit être ≥ ${min}`).max(max, `doit être ≤ ${max}`);
const int = (min, max) => number(min, max).int("doit être un entier");

const ROLES = ["USER", "COACH", "ADMIN"];
const TYPES = ["FORCE", "ENDURANCE", "HYPERTROPHIE", "FIGURE"];

const date = z
  .string({ error: "doit être une date" })
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "date invalide")
  .transform((v) => new Date(v));

module.exports = { z, validate, nullable, id, text, requiredText, number, int, date, ROLES, TYPES };
