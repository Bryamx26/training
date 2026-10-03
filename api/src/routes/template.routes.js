const express = require("express");
const controller = require("../controllers/template.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

// Templates de séance : réservés aux coachs, chacun ne voit que les siens.
router.use(requireAuth, requireStaff);

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", asyncHandler(controller.create));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
