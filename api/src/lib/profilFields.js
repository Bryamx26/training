// Champs de profil renvoyés par l'API (jamais le hash du mot de passe).

// Profil complet : soi-même, son coach, un admin.
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

// Fiche publique d'un coach, visible par tout utilisateur connecté.
const COACH_FIELDS = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
  createdAt: true,
};

module.exports = { PUBLIC_FIELDS, COACH_FIELDS };
