const { sendSuccess } = require("../../utils/apiResponse");
const paymentsService = require("./payments.service");
const stripeService = require("./stripe.service");

async function initiatePayment(req, res) {
  const { order_id, gateway } = req.body;
  const result = await paymentsService.initiatePayment(req.user.sub, { order_id, gateway });
  sendSuccess(res, result);
}

async function jazzcashWebhook(req, res) {
  await paymentsService.handleJazzcashWebhook(req.body);
  res.status(200).send("OK");
}

// Handles the browser redirect from the JazzCash portal after payment
async function jazzcashCallback(req, res) {
  // JazzCash POSTs (or GETs) form data to this URL after the user pays
  const data = { ...req.query, ...req.body };
  const result = await paymentsService.handleJazzcashCallback(data);
  const { FRONTEND_URL } = require("../../config/env");
  res.redirect(`${FRONTEND_URL}${result.redirect}`);
}

async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripeService.verifyWebhook(req.body, signature);
  } catch (err) {
    console.error(`Stripe signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await paymentsService.handleStripeWebhook(event);

  res.status(200).send("OK");
}

async function getPaymentStatus(req, res) {
  const { orderId } = req.params;
  const result = await paymentsService.getPaymentStatus(req.user.sub, orderId);
  sendSuccess(res, result);
}

async function adminRefund(req, res) {
  const { order_id } = req.body;
  const result = await paymentsService.adminRefund(order_id);
  sendSuccess(res, result);
}

module.exports = {
  initiatePayment,
  jazzcashWebhook,
  jazzcashCallback,
  stripeWebhook,
  getPaymentStatus,
  adminRefund
};
