const express = require("express");
const controller = require("../controllers/profil.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, optionalAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Inscription publique ; un coach connecté l'utilise aussi pour créer un sportif.
router.post("/", optionalAuth, asyncHandler(controller.create));

// Liste complète : admin uniquement. Un coach utilise GET /api/me/subscribers.
router.get("/", requireAuth, requireAdmin, asyncHandler(controller.list));
router.get("/:id", requireAuth, asyncHandler(controller.getById));
router.put("/:id", requireAuth, asyncHandler(controller.update));
router.delete("/:id", requireAuth, asyncHandler(controller.remove));

module.exports = router;
