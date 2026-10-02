const express = require("express");
const controller = require("../controllers/exercice.controller");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", asyncHandler(controller.create));
router.put("/:id", asyncHandler(controller.update));
router.put("/:id/notes/:profilId", asyncHandler(controller.grade));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
