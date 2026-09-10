const express = require("express");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const authRoutes = require("../modules/auth/auth.routes");
const googleRoutes = require("../modules/auth/google.routes");
const categoriesRoutes = require("../modules/categories/categories.routes");
const productsRoutes = require("../modules/products/products.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const ordersRoutes = require("../modules/orders/orders.routes");
const paymentsRoutes = require("../modules/payments/payments.routes");
const usersRoutes = require("../modules/users/users.routes");
const reviewsRoutes = require("../modules/reviews/reviews.routes");
const couponsRoutes = require("../modules/coupons/coupons.routes");
const analyticsRoutes = require("../modules/admin/analytics.routes");
const settingsRoutes = require("../modules/settings/settings.routes");
const servicesRoutes = require("../modules/services/services.routes");
const teamRoutes = require("../modules/team/team.routes");
const notificationsRoutes = require("../modules/notifications/notifications.routes");

const router = express.Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    sendSuccess(res, { message: "Karakurum Silkrute Traders backend is running" });
  })
);

router.use("/auth", authRoutes);
router.use("/auth", googleRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/", ordersRoutes);
router.use("/", paymentsRoutes);
router.use("/", usersRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/admin/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/services", servicesRoutes);
router.use("/team", teamRoutes);
router.use("/admin/notifications", notificationsRoutes);

const productsController = require("../modules/products/products.controller");
router.get("/admin/products", auth, role("admin"), asyncHandler(productsController.listAdminProducts));

module.exports = router;
