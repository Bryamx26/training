const prisma = require("../lib/prisma");
const { validate } = require("../lib/validation");
const schemas = require("../lib/schemas");

async function list(req, res) {
  const muscles = await prisma.muscle.findMany({ orderBy: { nom: "asc" } });
  res.json(muscles);
}

async function create(req, res) {
  const { nom } = validate(schemas.muscleCreate, req.body);
  const muscle = await prisma.muscle.create({ data: { nom } });
  res.status(201).json(muscle);
}

module.exports = { list, create };
