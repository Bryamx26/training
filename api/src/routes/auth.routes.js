const express = require("express");
const controller = require("../controllers/auth.controller");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimit");

const router = express.Router();

router.post("/login", loginLimiter, asyncHandler(controller.login));
router.post("/google", loginLimiter, asyncHandler(controller.google));
router.post("/logout", asyncHandler(controller.logout));
router.get("/me", requireAuth, asyncHandler(controller.me));

module.exports = router;
