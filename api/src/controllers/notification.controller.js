const prisma = require("../lib/prisma");
const { validate } = require("../lib/validation");
const schemas = require("../lib/schemas");

const LIMIT = 50;

// GET /api/me/notifications — les plus récentes d'abord, avec le nombre de non lues.
async function list(req, res) {
  const [notifications, nonLues] = await Promise.all([
    prisma.notification.findMany({ where: { profilId: req.user.id }, orderBy: { createdAt: "desc" }, take: LIMIT }),
    prisma.notification.count({ where: { profilId: req.user.id, lu: false } }),
  ]);
  res.json({ notifications, nonLues });
}

// POST /api/me/notifications/read { ids? } — marque comme lues les
// notifications données, ou toutes sans `ids`. Ne touche qu'aux siennes.
async function markRead(req, res) {
  const { ids } = validate(schemas.notificationsRead, req.body);
  await prisma.notification.updateMany({
    where: { profilId: req.user.id, lu: false, ...(ids && { id: { in: ids } }) },
    data: { lu: true },
  });
  res.status(204).send();
}

module.exports = { list, markRead };
