const express = require("express");
const controller = require("../controllers/exercice.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

// Les sportifs lisent leurs exercices via /api/circuits ; ces routes
// (édition et notation) sont réservées au staff.
router.use(requireAuth, requireStaff);

router.get("/", asyncHandler(controller.list));
router.get("/catalogue", asyncHandler(controller.catalogue));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", asyncHandler(controller.create));
router.put("/:id", asyncHandler(controller.update));
router.put("/:id/notes/:profilId", asyncHandler(controller.grade));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
