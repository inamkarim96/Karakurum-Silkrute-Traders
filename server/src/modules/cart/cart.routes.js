const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const cartController = require("./cart.controller");

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(cartController.getCart));
router.post("/items", asyncHandler(cartController.addItem));
router.put("/items/:itemId", asyncHandler(cartController.updateItem));
router.delete("/items/:itemId", asyncHandler(cartController.removeItem));
router.delete("/", asyncHandler(cartController.clearCart));
router.post("/merge", asyncHandler(cartController.mergeCart));

module.exports = router;
