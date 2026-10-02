const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const PUBLIC_FIELDS = {
  id: true,
  nom: true,
  prenom: true,
  mail: true,
  poids: true,
  taille: true,
  age: true,
  blessures: true,
  role: true,
  createdAt: true,
};

async function list(req, res) {
  const profils = await prisma.profil.findMany({ select: PUBLIC_FIELDS });
  res.json(profils);
}

async function getById(req, res) {
  const profil = await prisma.profil.findUnique({
    where: { id: Number(req.params.id) },
    select: PUBLIC_FIELDS,
  });
  if (!profil) return res.status(404).json({ error: "Profil introuvable" });
  res.json(profil);
}

async function create(req, res) {
  const { nom, prenom, mail, motDePasse, poids, taille, age, blessures, role } = req.body;
  if (!nom || !prenom || !mail || !motDePasse) {
    return res.status(400).json({ error: "nom, prenom, mail et motDePasse sont requis" });
  }

  const hashed = await bcrypt.hash(motDePasse, 10);

  const profil = await prisma.profil.create({
    data: { nom, prenom, mail, motDePasse: hashed, poids, taille, age, blessures, role },
    select: PUBLIC_FIELDS,
  });
  res.status(201).json(profil);
}

async function update(req, res) {
  const { nom, prenom, mail, motDePasse, poids, taille, age, blessures, role } = req.body;

  const data = { nom, prenom, mail, poids, taille, age, blessures, role };
  if (motDePasse) data.motDePasse = await bcrypt.hash(motDePasse, 10);

  const profil = await prisma.profil.update({
    where: { id: Number(req.params.id) },
    data,
    select: PUBLIC_FIELDS,
  });
  res.json(profil);
}

async function remove(req, res) {
  await prisma.profil.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
