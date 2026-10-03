const express = require("express");
const controller = require("../controllers/circuit.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

// Lecture : le controller limite un sportif à ses propres séances.
router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));

// Écriture : réservée au staff.
router.post("/", requireStaff, asyncHandler(controller.create));
router.put("/:id", requireStaff, asyncHandler(controller.update));
router.delete("/:id", requireStaff, asyncHandler(controller.remove));

router.put("/:id/participants", requireStaff, asyncHandler(controller.setParticipants));
router.post("/:id/participants", requireStaff, asyncHandler(controller.addParticipant));
router.delete("/:id/participants/:profilId", requireStaff, asyncHandler(controller.removeParticipant));

module.exports = router;
