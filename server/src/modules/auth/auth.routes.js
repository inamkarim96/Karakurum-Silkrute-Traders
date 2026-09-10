const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", asyncHandler(authController.login));
router.post("/register", asyncHandler(authController.register));

module.exports = router;
