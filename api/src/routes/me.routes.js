const express = require("express");
const controller = require("../controllers/subscription.controller");
const notifications = require("../controllers/notification.controller");
const dataExport = require("../controllers/export.controller");
const profils = require("../controllers/profil.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/coaches", asyncHandler(controller.myCoaches));
router.get("/subscribers", requireStaff, asyncHandler(controller.mySubscribers));
router.delete("/subscribers/:athleteId", requireStaff, asyncHandler(controller.removeSubscriber));

// Acceptation des CGU à la première connexion (compte créé par un coach).
router.post("/cgu", asyncHandler(profils.acceptCgu));

router.get("/notifications", asyncHandler(notifications.list));
router.post("/notifications/read", asyncHandler(notifications.markRead));

// Export RGPD de toutes les données du compte.
router.get("/export", asyncHandler(dataExport.exportMine));

module.exports = router;
