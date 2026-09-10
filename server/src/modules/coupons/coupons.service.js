const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");

function toNumber(value) {
  return Number(value || 0);
}

async function validateCoupon(code, subtotal) {
  const coupon = await cache.getOrSet(`coupon:code:${code}`, 30, () =>
    prisma.coupons.findUnique({ where: { code } })
  );

  if (!coupon) {
    return { valid: false, reason: "Invalid coupon code" };
  }

  if (!coupon.is_active) {
    return { valid: false, reason: "Coupon is inactive" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: "Coupon has expired" };
  }

  if (coupon.max_uses !== null && toNumber(coupon.used_count) >= toNumber(coupon.max_uses)) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  if (toNumber(subtotal) < toNumber(coupon.min_order_amount)) {
    return { valid: false, reason: `Order does not meet minimum amount of Rs. ${coupon.min_order_amount}` };
  }

  let discount_amount = 0;
  if (coupon.type === "percentage") {
    discount_amount = (toNumber(subtotal) * toNumber(coupon.value)) / 100;
  } else {
    discount_amount = toNumber(coupon.value);
  }

  if (discount_amount > subtotal) discount_amount = subtotal;

  return {
    valid: true,
    type: coupon.type,
    value: coupon.value,
    discount_amount
  };
}

async function listAllCoupons() {
  return cache.getOrSet("coupons:all", 120, () =>
    prisma.coupons.findMany({
      orderBy: { created_at: "desc" }
    })
  );
}

async function createCoupon(data) {
  const existing = await prisma.coupons.findUnique({ where: { code: data.code } });
  if (existing) {
    throw new ApiError(409, "Coupon code already exists", "DUPLICATE_COUPON");
  }

  const result = await prisma.coupons.create({
    data: {
      ...data,
      created_at: new Date()
    }
  });
  await cache.del("coupons:all");
  return result;
}

async function updateCoupon(id, data) {
  try {
    const result = await prisma.coupons.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date()
      }
    });
    await Promise.all([
      cache.del("coupons:all"),
      cache.clearPattern("coupon:code:")
    ]);
    return result;
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Coupon not found", "NOT_FOUND");
    }
    throw err;
  }
}

async function deactivateCoupon(id) {
  try {
    const result = await prisma.coupons.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });
    await Promise.all([
      cache.del("coupons:all"),
      cache.clearPattern("coupon:code:")
    ]);
    return result;
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Coupon not found", "NOT_FOUND");
    }
    throw err;
  }
}

module.exports = {
  validateCoupon,
  listAllCoupons,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
};
