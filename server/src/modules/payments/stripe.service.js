const stripe = require("stripe");
const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL } = require("../../config/env");
const settingsService = require("../settings/settings.service");

let stripeClient;

const getStripeClient = () => {
  if (!stripeClient) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
    }
    stripeClient = stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

async function createCheckoutSession(order) {
  const amount = Math.round(Number(order.total) * 100); // PKR uses paisa (100)

  // Get company name from settings
  const settings = await settingsService.getSettings();
  const companyName = settings?.company_name || "Karakurum Silkrute Traders";

  const session = await getStripeClient().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'pkr',
          product_data: {
            name: `${companyName} Order #${order.id}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${FRONTEND_URL}/order-confirmation?order_id=${order.id}&via=stripe`,
    cancel_url: `${FRONTEND_URL}/payment/failed?order_id=${order.id}&reason=cancelled`,
    metadata: {
      order_id: order.id
    }
  });

  return {
    client_secret: null,
    payment_url: session.url
  };
}

function verifyWebhook(body, signature) {
  return getStripeClient().webhooks.constructEvent(
    body,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  createCheckoutSession,
  verifyWebhook
};
