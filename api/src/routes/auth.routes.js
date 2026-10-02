const express = require("express");
const controller = require("../controllers/auth.controller");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(controller.login));
router.post("/google", asyncHandler(controller.google));

module.exports = router;
