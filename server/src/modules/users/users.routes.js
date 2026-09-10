const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./users.controller");

const router = express.Router();

router.get("/users/me", auth, asyncHandler(controller.getProfile));
router.put("/users/me", auth, asyncHandler(controller.updateProfile));
router.put("/users/me/password", auth, asyncHandler(controller.changePassword));

router.get("/users/me/addresses", auth, asyncHandler(controller.getAddresses));
router.post("/users/me/addresses", auth, asyncHandler(controller.addAddress));
router.put("/users/me/addresses/:id", auth, asyncHandler(controller.updateAddress));
router.delete("/users/me/addresses/:id", auth, asyncHandler(controller.deleteAddress));

router.get("/admin/users", auth, role("admin"), asyncHandler(controller.listUsers));
router.get("/admin/users/:id", auth, role("admin"), asyncHandler(controller.getUserDetails));
router.patch("/admin/users/:id/status", auth, role("admin"), asyncHandler(controller.updateUserStatus));

module.exports = router;
