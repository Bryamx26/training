const express = require("express");
const controller = require("../controllers/circuit.controller");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", asyncHandler(controller.create));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

router.put("/:id/participants", asyncHandler(controller.setParticipants));
router.post("/:id/participants", asyncHandler(controller.addParticipant));
router.delete("/:id/participants/:profilId", asyncHandler(controller.removeParticipant));

module.exports = router;
