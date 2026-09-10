const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./products.controller");
const { productImageUpload } = require("../../config/cloudinary");

const router = express.Router();

router.get("/", asyncHandler(controller.listProducts));
router.get("/featured", asyncHandler(controller.getFeaturedProducts));
router.get("/search", asyncHandler(controller.searchProducts));
router.get("/slug/:slug", asyncHandler(controller.getProductBySlug));
router.get("/:id", asyncHandler(controller.getProductById));

router.post("/", auth, role("admin"), asyncHandler(controller.createProduct));
router.put("/:id", auth, role("admin"), asyncHandler(controller.updateProduct));
router.patch("/:id/stock", auth, role("admin"), asyncHandler(controller.updateStock));
router.delete("/:id", auth, role("admin"), asyncHandler(controller.deleteProduct));
router.post(
  "/:id/images",
  auth,
  role("admin"),
  productImageUpload,
  asyncHandler(controller.uploadProductImageById)
);

module.exports = router;
