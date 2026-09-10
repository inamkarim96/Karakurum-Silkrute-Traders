const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");
const jazzcashService = require("./jazzcash.service");
const stripeService = require("./stripe.service");
const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function sendEmailAsync({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;
  sgMail
    .send({ to, from: SENDGRID_FROM_EMAIL, subject, text, html })
    .catch((error) => console.error("Email send failed:", error?.message || error));
}

async function initiatePayment(userId, { order_id, gateway }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id: order_id },
      include: {
        users: { select: { email: true, id: true } },
        payments: true
      }
    });

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.user_id !== userId) {
      throw new ApiError(403, "Not authorized to access this order", "FORBIDDEN");
    }

    if (order.status !== "pending") {
      throw new ApiError(400, "Order is not in pending status", "INVALID_ORDER_STATE");
    }

    if (order.payments && order.payments.status !== "pending" && order.payments.status !== "failed") {
      throw new ApiError(400, "Payment is already processed or in progress", "INVALID_PAYMENT_STATE");
    }

    if (!order.payments) {
      await tx.payments.create({
        data: {
          order_id: order.id,
          gateway,
          amount: order.total,
          status: "pending"
        }
      });
    } else {
      await tx.payments.update({
        where: { id: order.payments.id },
        data: {
          gateway,
          amount: order.total,
          status: "pending",
          updated_at: new Date()
        }
      });
    }

    if (gateway === "cod") {
      await tx.orders.update({
        where: { id: order.id },
        data: { status: "processing", updated_at: new Date() }
      });
      return { success: true, message: "Order placed successfully with Cash on Delivery." };
    }

    if (gateway === "jazzcash" || gateway === "easypaisa") {
      const response = await jazzcashService.initiateJazzcashPayment({
        ...order,
        user_email: order.users?.email
      });
      const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      return { payment_url: null, jazzcash_response: response, expires_at };
    }

    if (gateway === "stripe") {
      const { client_secret, payment_url } = await stripeService.createCheckoutSession(order);
      return { client_secret, payment_url };
    }

    throw new ApiError(400, "Unsupported gateway", "INVALID_GATEWAY");
  });
}

async function handleJazzcashWebhook(data) {
  if (!jazzcashService.verifyHash(data)) {
    throw new ApiError(400, "Invalid signature", "INVALID_SIGNATURE");
  }

  const billRef = data.pp_BillReference;
  const orderId = billRef ? billRef.replace("order_", "") : "";

  if (!orderId) {
    throw new ApiError(400, "Invalid order reference", "INVALID_DATA");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: {
        users: { select: { email: true } },
        payments: true
      }
    });

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (!order.payments || order.payments.status === "completed") {
      return { success: true };
    }

    const paidAmount = Number(data.pp_Amount) / 100;
    if (Math.abs(Number(order.total) - paidAmount) > 0.01) {
      throw new ApiError(400, "Amount mismatch", "AMOUNT_MISMATCH");
    }

    const isSuccess = data.pp_ResponseCode === "000" || data.pp_ResponseCode === "121";
    const status = isSuccess ? "completed" : "failed";

    await tx.payments.update({
      where: { id: order.payments.id },
      data: {
        status,
        transaction_id: data.pp_TxnRefNo || null,
        gateway_resp: JSON.stringify(data),
        paid_at: isSuccess ? new Date() : null,
        updated_at: new Date()
      }
    });

    if (cache) await cache.del(`payment:status:${orderId}`);

    if (isSuccess && order.status === "pending") {
      await tx.orders.update({
        where: { id: order.id },
        data: { status: "processing", updated_at: new Date() }
      });

      sendEmailAsync({
        to: order.users.email,
        subject: `Payment Successful - Order #${order.id}`,
        text: `Your payment for order #${order.id} was successful.`,
        html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p>`
      });
    }
    
    return { success: true };
  });
}

async function handleStripeWebhook(event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.order_id;
    
    if (!orderId) return { success: true };

    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { users: { select: { email: true } }, payments: true }
      });

      if (!order || !order.payments) return;

      await tx.payments.update({
        where: { id: order.payments.id },
        data: {
          status: "completed",
          transaction_id: session.payment_intent || session.id,
          gateway_resp: JSON.stringify(session),
          paid_at: new Date(),
          updated_at: new Date()
        }
      });

      if (cache) await cache.del(`payment:status:${orderId}`);

      if (order.status === "pending") {
        await tx.orders.update({
          where: { id: order.id },
          data: { status: "processing", updated_at: new Date() }
        });

        sendEmailAsync({
          to: order.users.email,
          subject: `Payment Successful - Order #${order.id}`,
          text: `Your payment for order #${order.id} was successful.`,
          html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p>`
        });
      }
    });
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const orderId = session.metadata.order_id;
    
    if (orderId) {
      await prisma.payments.updateMany({
        where: { order_id: orderId },
        data: {
          status: "failed",
          gateway_resp: JSON.stringify(session),
          updated_at: new Date()
        }
      });
    }
  }

  return { success: true };
}

async function getPaymentStatus(userId, orderId) {
  const cacheKey = `payment:status:${orderId}`;
  return cache.getOrSet(cacheKey, 10, async () => {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.user_id !== userId) {
      throw new ApiError(403, "Not authorized", "FORBIDDEN");
    }

    if (!order.payments) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    return {
      order_id: order.id,
      order_status: order.status,
      payment_status: order.payments.status,
      payment_method: order.payments.gateway,
      transaction_id: order.payments.transaction_id,
      paid_at: order.payments.paid_at
    };
  });
}

async function adminRefund(orderId) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payments.findUnique({
      where: { order_id: orderId }
    });
    
    if (!payment) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (payment.status !== "completed") {
      throw new ApiError(400, "Only completed payments can be refunded", "INVALID_PAYMENT_STATE");
    }

    await tx.payments.update({
      where: { id: payment.id },
      data: { status: "refunded", updated_at: new Date() }
    });

    await tx.orders.update({
      where: { id: orderId },
      data: { status: "cancelled", updated_at: new Date() }
    });

    return { success: true, message: "Payment refunded successfully" };
  });
}

// handleJazzcashCallback processes the POST redirect from the JazzCash portal
// after the user completes (or abandons) the payment flow.
async function handleJazzcashCallback(data) {
  const isValid = jazzcashService.verifyHash(data);
  if (!isValid) {
    return { success: false, redirect: "/payment/failed?reason=invalid_signature" };
  }

  const billRef = data.pp_BillReference;
  const orderId = billRef ? billRef.replace("order_", "") : "";

  if (!orderId) {
    return { success: false, redirect: "/payment/failed?reason=invalid_ref" };
  }

  const isSuccess = data.pp_ResponseCode === "000" || data.pp_ResponseCode === "121";

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { users: { select: { email: true } }, payments: true }
      });

      if (!order || !order.payments || order.payments.status === "completed") return;

      const status = isSuccess ? "completed" : "failed";

      await tx.payments.update({
        where: { id: order.payments.id },
        data: {
          status,
          transaction_id: data.pp_TxnRefNo || null,
          gateway_resp: JSON.stringify(data),
          paid_at: isSuccess ? new Date() : null,
          updated_at: new Date()
        }
      });

      if (cache) await cache.del(`payment:status:${orderId}`);

      if (isSuccess && order.status === "pending") {
        await tx.orders.update({
          where: { id: order.id },
          data: { status: "processing", updated_at: new Date() }
        });

        sendEmailAsync({
          to: order.users.email,
          subject: `Payment Successful - Order #${order.id}`,
          text: `Your payment for order #${order.id} was successful.`,
          html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p>`
        });
      }
    });
  } catch (err) {
    console.error("JazzCash callback processing error:", err.message);
  }

  if (isSuccess) {
    return { redirect: `/order-confirmation?order_id=${orderId}&via=jazzcash` };
  }
  return { redirect: `/payment/failed?order_id=${orderId}&code=${data.pp_ResponseCode || "unknown"}` };
}

module.exports = {
  initiatePayment,
  handleJazzcashWebhook,
  handleJazzcashCallback,
  handleStripeWebhook,
  getPaymentStatus,
  adminRefund
};
