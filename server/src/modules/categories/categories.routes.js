const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./categories.controller");
const { categoryImageUpload } = require("../../config/cloudinary");

const router = express.Router();

router.get("/", asyncHandler(controller.listCategories));
router.get("/:id", asyncHandler(controller.getCategoryById));
router.post("/", auth, role("admin"), asyncHandler(controller.createCategory));
router.put("/:id", auth, role("admin"), asyncHandler(controller.updateCategory));
router.delete("/:id", auth, role("admin"), asyncHandler(controller.deleteCategory));
router.post("/initialize", auth, role("admin"), asyncHandler(controller.initializeCategories));
router.post(
  "/:id/images",
  auth,
  role("admin"),
  categoryImageUpload,
  asyncHandler(controller.uploadCategoryImage)
);

module.exports = router;
