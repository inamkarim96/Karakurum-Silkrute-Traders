const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { pageImageUpload } = require("../../config/cloudinary");
const controller = require("./settings.controller");

const router = express.Router();

// Public: any page (Navbar, Footer, About, Contact) can read site settings
router.get("/", asyncHandler(controller.getSettings));

// Admin-only: update company info from the Site Settings screen
router.put("/", auth, role("admin"), asyncHandler(controller.updateSettings));

// Admin-only: upload a page hero / section image to Cloudinary, returns { url }
router.post(
  "/upload-image",
  auth,
  role("admin"),
  pageImageUpload,
  asyncHandler(controller.uploadSettingsImage)
);

module.exports = router;
