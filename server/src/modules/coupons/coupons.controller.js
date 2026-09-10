const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const couponsService = require("./coupons.service");

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, order_subtotal } = req.body;
  const result = await couponsService.validateCoupon(code, order_subtotal);
  sendSuccess(res, result);
});

const listAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponsService.listAllCoupons();
  sendSuccess(res, coupons);
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponsService.createCoupon(req.body);
  sendSuccess(res, coupon, 201);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await couponsService.updateCoupon(id, req.body);
  sendSuccess(res, coupon);
});

const deactivateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await couponsService.deactivateCoupon(id);
  sendSuccess(res, { message: "Coupon deactivated successfully" });
});

module.exports = {
  validateCoupon,
  listAllCoupons,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
};
