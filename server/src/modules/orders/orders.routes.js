const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./orders.controller");

const router = express.Router();

router.get("/orders", auth, asyncHandler(controller.listOwnOrders));
router.get("/orders/:id", auth, asyncHandler(controller.getOwnOrder));
router.post("/orders", auth, asyncHandler(controller.createOrder));
router.post("/orders/:id/cancel", auth, asyncHandler(controller.cancelOwnOrder));
router.delete("/orders/:id", auth, asyncHandler(controller.deleteOwnOrder));

router.get("/admin/orders", auth, role("admin"), asyncHandler(controller.listAdminOrders));
router.get("/admin/orders/:id", auth, role("admin"), asyncHandler(controller.getAdminOrder));
router.patch(
  "/admin/orders/:id",
  auth,
  role("admin"),
  asyncHandler(controller.updateOrderStatusByAdmin)
);
router.patch(
  "/admin/orders/:id/notes",
  auth,
  role("admin"),
  asyncHandler(controller.updateOrderAdminNotes)
);

module.exports = router;
