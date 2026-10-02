const express = require("express");
const controller = require("../controllers/muscle.controller");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.post("/", asyncHandler(controller.create));

module.exports = router;
