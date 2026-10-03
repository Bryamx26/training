const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const { parseExercice, requiredName, optionalText, optionalType, invalid } = require("../lib/exerciceData");

// Templates de séance. Ils sont personnels : chaque requête est limitée au
// coach du jeton (req.user). Le template d'un autre coach répond 404, comme
// un template inexistant, pour ne pas révéler son existence.

const EXERCICES = { orderBy: { ordre: "asc" } };

// Valide le corps d'une création / modification.
function parseTemplateBody(body) {
  if (!Array.isArray(body?.exercices)) throw invalid("exercices doit être une liste");
  if (body.exercices.length === 0) throw invalid("Un template doit contenir au moins un exercice");
  return {
    nom: requiredName(body.nom, "Le nom du template"),
    niveau: optionalText(body.niveau, "niveau"),
    type: optionalType(body.type),
    exercices: body.exercices.map((ex, i) => parseExercice(ex, i)),
  };
}

// Vérifie que le template existe ET appartient au coach connecté.
async function findOwnTemplate(req) {
  const template = await prisma.circuitTemplate.findFirst({
    where: { id: Number(req.params.id), coachId: req.user.id },
    include: { exercices: EXERCICES },
  });
  if (!template) throw new HttpError(404, "Template introuvable", "TEMPLATE_NOT_FOUND");
  return template;
}

// GET /api/templates — résumé des templates du coach connecté.
async function list(req, res) {
  const templates = await prisma.circuitTemplate.findMany({
    where: { coachId: req.user.id },
    include: { _count: { select: { exercices: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(templates.map(({ _count, ...t }) => ({ ...t, exercicesCount: _count.exercices })));
}

// GET /api/templates/:id
async function getById(req, res) {
  res.json(await findOwnTemplate(req));
}

// POST /api/templates — le propriétaire est toujours le coach du jeton.
async function create(req, res) {
  const { exercices, ...data } = parseTemplateBody(req.body);
  const template = await prisma.circuitTemplate.create({
    data: { ...data, coachId: req.user.id, exercices: { create: exercices } },
    include: { exercices: EXERCICES },
  });
  res.status(201).json(template);
}

// PUT /api/templates/:id — remplace tout le contenu du template. Les séances
// créées depuis ce template ont leur propre copie et ne changent pas.
async function update(req, res) {
  const existing = await findOwnTemplate(req);
  const { exercices, ...data } = parseTemplateBody(req.body);

  const [, template] = await prisma.$transaction([
    prisma.templateExercice.deleteMany({ where: { templateId: existing.id } }),
    prisma.circuitTemplate.update({
      where: { id: existing.id },
      data: { ...data, exercices: { create: exercices } },
      include: { exercices: EXERCICES },
    }),
  ]);
  res.json(template);
}

// DELETE /api/templates/:id
async function remove(req, res) {
  const existing = await findOwnTemplate(req);
  await prisma.circuitTemplate.delete({ where: { id: existing.id } });
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
