const express = require("express");
const router = express.Router();
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const ctrl = require("./notifications.controller");

// All routes require admin authentication
router.get("/",                asyncHandler(auth), role("admin"), asyncHandler(ctrl.listNotifications));
router.get("/unread-count",    asyncHandler(auth), role("admin"), asyncHandler(ctrl.getUnreadCount));
router.patch("/mark-all-read", asyncHandler(auth), role("admin"), asyncHandler(ctrl.markAllRead));
router.patch("/:id/read",      asyncHandler(auth), role("admin"), asyncHandler(ctrl.markAsRead));

module.exports = router;
