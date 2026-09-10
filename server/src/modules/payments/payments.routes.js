const express = require("express");
const Joi = require("joi");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./payments.controller");
const ApiError = require("../../utils/apiError");

const router = express.Router();

const initiatePaymentSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  gateway: Joi.string().valid("jazzcash", "easypaisa", "stripe", "cod").required()
});

const validateInitiatePayment = (req, res, next) => {
  const { error } = initiatePaymentSchema.validate(req.body);
  if (error) {
    return next(new ApiError(400, error.message, "VALIDATION_ERROR"));
  }
  next();
};

router.post("/payments/initiate", auth, validateInitiatePayment, asyncHandler(controller.initiatePayment));
router.post("/payments/webhook/jazzcash", asyncHandler(controller.jazzcashWebhook));
router.post("/payments/webhook/stripe", asyncHandler(controller.stripeWebhook));
// JazzCash redirects the browser back here after payment (supports both GET & POST)
router.get("/payments/callback/jazzcash", asyncHandler(controller.jazzcashCallback));
router.post("/payments/callback/jazzcash", asyncHandler(controller.jazzcashCallback));
router.get("/payments/order/:orderId", auth, asyncHandler(controller.getPaymentStatus));

router.post("/admin/payments/refund", auth, role("admin"), asyncHandler(controller.adminRefund));

module.exports = router;
