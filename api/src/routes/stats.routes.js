const express = require("express");
const controller = require("../controllers/stats.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

// Le controller vérifie que l'appelant peut voir le profil demandé.
router.get("/muscles", asyncHandler(controller.muscles));
router.get("/exercices", asyncHandler(controller.exercices));

module.exports = router;
