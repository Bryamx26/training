const prisma = require("./prisma");
const HttpError = require("./httpError");
const { canManageCircuit } = require("./permissions");

// Charge une séance et vérifie que l'utilisateur connecté peut la gérer
// (son auteur, ou un admin). Lance 404 / 403 sinon.
async function findManageableCircuit(user, circuitId) {
  const circuit = await prisma.circuit.findUnique({
    where: { id: Number(circuitId) },
    select: { id: true, auteurId: true, personnes: { select: { profilId: true } } },
  });
  if (!circuit) throw new HttpError(404, "Séance introuvable", "CIRCUIT_NOT_FOUND");
  if (!canManageCircuit(user, circuit)) throw new HttpError(403, "Cette séance appartient à un autre coach", "FORBIDDEN");
  return circuit;
}

module.exports = { findManageableCircuit };
