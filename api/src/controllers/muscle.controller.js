const prisma = require("../lib/prisma");

async function list(req, res) {
  const muscles = await prisma.muscle.findMany({ orderBy: { nom: "asc" } });
  res.json(muscles);
}

async function create(req, res) {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: "nom est requis" });

  const muscle = await prisma.muscle.create({ data: { nom } });
  res.status(201).json(muscle);
}

module.exports = { list, create };
