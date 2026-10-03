const express = require("express");
const controller = require("../controllers/subscription.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth, requireStaff } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/coaches", asyncHandler(controller.myCoaches));
router.get("/subscribers", requireStaff, asyncHandler(controller.mySubscribers));

module.exports = router;
