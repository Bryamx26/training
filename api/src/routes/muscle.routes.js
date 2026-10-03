const express = require("express");
const controller = require("../controllers/muscle.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.list));
router.post("/", requireStaff, asyncHandler(controller.create));

module.exports = router;
