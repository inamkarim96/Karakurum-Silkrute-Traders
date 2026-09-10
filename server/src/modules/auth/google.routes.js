const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./google.controller");

const router = express.Router();

router.get("/google", asyncHandler(controller.redirectToGoogle));
router.get("/google/callback", asyncHandler(controller.handleGoogleCallback));
router.post("/google/link", asyncHandler(controller.linkGoogleAccount));

module.exports = router;