const prisma = require("./prisma");

// Notifications internes à l'application. `notify` n'échoue jamais la requête
// qui l'appelle : une notification perdue ne doit pas annuler l'action métier.

// Envoie la même notification à plusieurs profils, sauf à l'auteur de l'action.
async function notify(profilIds, { type, message, lien = null }, { except } = {}) {
  // Un id absent (ex. auteur supprimé d'une séance) est ignoré.
  const ids = [...new Set(profilIds.map(Number))].filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== except);
  if (ids.length === 0) return;
  try {
    await prisma.notification.createMany({ data: ids.map((profilId) => ({ profilId, type, message, lien })) });
  } catch (err) {
    console.error("Notification non enregistrée", err);
  }
}

// Variante sans doublon : rien n'est créé si le profil a déjà une notification
// non lue du même type pour le même lien (ex. plusieurs exercices notés d'affilée).
async function notifyOnce(profilId, notification) {
  const existing = await prisma.notification.findFirst({
    where: { profilId, type: notification.type, lien: notification.lien, lu: false },
    select: { id: true },
  });
  if (!existing) await notify([profilId], notification);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

module.exports = { notify, notifyOnce, formatDate };
