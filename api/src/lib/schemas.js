const { z, nullable, id, text, requiredText, number, int, date, ROLES, TYPES } = require("./validation");

// Schémas des corps de requête (voir lib/validation.js).

const mail = z.string({ error: "doit être un texte" }).trim().toLowerCase().pipe(z.email("adresse e-mail invalide"));
const motDePasse = z.string({ error: "doit être un texte" }).min(8, "8 caractères minimum").max(200);

const login = z.object({
  mail: z.string({ error: "est requis" }).trim().min(1, "est requis"),
  motDePasse: z.string({ error: "est requis" }).min(1, "est requis"),
});

const profilFields = {
  nom: requiredText(100),
  prenom: requiredText(100),
  mail,
  poids: nullable(number(1, 500)),
  taille: nullable(number(30, 300)),
  age: nullable(int(1, 130)),
  blessures: nullable(text(2000)),
};

const profilCreate = z.object({
  ...profilFields,
  motDePasse,
  role: z.enum(ROLES, { error: `doit valoir ${ROLES.join(", ")}` }).optional(),
  // Case « J'accepte les CGU… » : exigée pour une inscription publique (voir profil.controller).
  accepteCgu: z.boolean({ error: "doit être un booléen" }).optional(),
});

const profilUpdate = z
  .object({
    ...profilFields,
    motDePasse: motDePasse.optional(),
    role: z.enum(ROLES, { error: `doit valoir ${ROLES.join(", ")}` }).optional(),
    demandeCoach: z.boolean().optional(),
  })
  .partial();

const circuitFields = {
  nom: requiredText(120),
  type: z.enum(TYPES, { error: `doit valoir ${TYPES.join(", ")}` }),
  niveau: nullable(text(60)),
  note: nullable(number(0, 10)),
  date,
};

const circuitCreate = z.object({
  ...circuitFields,
  participantIds: z.array(id).max(200).optional(),
  // Le contenu des exercices est validé par lib/exerciceData.js.
  exercices: z.array(z.any()).max(100).optional(),
  // Répète la séance chaque semaine : `semaines` occurrences au total.
  repetition: z.object({ semaines: int(1, 52) }).optional(),
});

const circuitUpdate = z.object(circuitFields).partial();

const participants = z.object({ participantIds: z.array(id, { error: "doit être un tableau" }).max(200) });
const participant = z.object({ profilId: id });

const grade = z.object({
  note: nullable(number(0, 10)),
  commentaire: nullable(text(2000)),
});

const realisation = z.object({
  commentaire: nullable(text(2000)),
  series: z
    .array(
      z.object({
        exerciceId: id,
        serie: int(1, 100),
        reps: nullable(int(0, 1000)),
        lest: nullable(number(0, 1000)),
        duree: nullable(int(0, 86400)),
      })
    )
    .max(500),
});

const notificationsRead = z.object({ ids: z.array(id).optional() });

module.exports = {
  login,
  profilCreate,
  profilUpdate,
  circuitCreate,
  circuitUpdate,
  participants,
  participant,
  grade,
  realisation,
  notificationsRead,
};
