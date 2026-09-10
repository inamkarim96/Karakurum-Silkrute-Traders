const express = require("express");
const controller = require("./coupons.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const router = express.Router();

router.post("/validate", auth, controller.validateCoupon);

// Admin routes
router.get("/admin", auth, role("admin"), controller.listAllCoupons);
router.post("/admin", auth, role("admin"), controller.createCoupon);
router.put("/admin/:id", auth, role("admin"), controller.updateCoupon);
router.delete("/admin/:id", auth, role("admin"), controller.deactivateCoupon);

module.exports = router;
