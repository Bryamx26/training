// Évite qu'une erreur dans un controller async (ex: contrainte FK Prisma)
// ne fasse planter tout le process Node : elle est transmise à next(err).
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
