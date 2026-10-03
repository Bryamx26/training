const express = require("express");
const controller = require("../controllers/subscription.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.searchCoaches));
router.get("/:coachId", asyncHandler(controller.getCoach));

// Le controller réserve l'abonnement aux sportifs et agit toujours sur
// l'utilisateur connecté : on ne peut pas modifier l'abonnement d'un autre.
router.post("/:coachId/subscribe", asyncHandler(controller.subscribe));
router.patch("/:coachId/subscribe", asyncHandler(controller.updateSubscription));

module.exports = router;
