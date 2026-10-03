// Règles d'accès centralisées. Rôles : USER (sportif), COACH, ADMIN.
// COACH et ADMIN forment le « staff » : ce sont les coachs de l'application,
// ils créent et notent les séances et peuvent avoir des abonnés.

function isStaff(user) {
  return user.role === "COACH" || user.role === "ADMIN";
}

function isAdmin(user) {
  return user.role === "ADMIN";
}

function isAthlete(user) {
  return user.role === "USER";
}

// Gérer une séance (modifier, supprimer, gérer participants et exercices) :
// son auteur, ou un admin.
function canManageCircuit(user, circuit) {
  return isAdmin(user) || circuit.auteurId === user.id;
}

// Voir une séance : son auteur, un admin, ou un sportif qui y participe.
function canViewCircuit(user, circuit) {
  return canManageCircuit(user, circuit) || circuit.personnes.some((p) => p.profilId === user.id);
}

module.exports = { isStaff, isAdmin, isAthlete, canManageCircuit, canViewCircuit };
