/**
 * emailService.js
 *
 * Centralized SendGrid email helper with branded HTML templates.
 * All notification emails in the app should go through this module
 * instead of calling sgMail directly in domain services.
 */

const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require("../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function canSendEmail() {
  return !!(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL);
}

function sendAsync(msg) {
  if (!canSendEmail()) return;
  sgMail
    .send(msg)
    .catch((err) =>
      console.error("[emailService] Send failed:", err?.response?.body || err?.message || err)
    );
}

// ─── Shared Layout ────────────────────────────────────────────────────────────

function emailWrapper(companyName, logoUrl, bodyHtml) {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:50px;max-width:180px;object-fit:contain;" />`
    : `<span style="font-size:20px;font-weight:700;color:#ffffff;">${companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:28px 36px;text-align:center;">${logoHtml}</td></tr>
<tr><td style="padding:36px 36px 28px;">${bodyHtml}</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 36px;text-align:center;border-top:1px solid #e9ecef;">
<p style="margin:0;font-size:13px;color:#6c757d;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
<p style="margin:6px 0 0;font-size:12px;color:#adb5bd;">This is an automated email. Please do not reply directly.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function primaryButton(text, url) {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#0f3460,#533483);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;margin:20px 0;">${text}</a>`;
}

function statusBadge(status) {
  const colors = {
    pending:    { bg: "#fff3cd", text: "#856404" },
    processing: { bg: "#cce5ff", text: "#004085" },
    shipped:    { bg: "#d4edda", text: "#155724" },
    delivered:  { bg: "#d1ecf1", text: "#0c5460" },
    cancelled:  { bg: "#f8d7da", text: "#721c24" }
  };
  const c = colors[status] || { bg: "#e2e3e5", text: "#383d41" };
  return `<span style="display:inline-block;background:${c.bg};color:${c.text};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;text-transform:capitalize;">${status}</span>`;
}

function orderItemsTable(items) {
  if (!items || !items.length) return "";
  const rows = items.map((item) => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${item.product_name}${item.variant_label ? ` <span style="color:#888;">(${item.variant_label})</span>` : ""}</td>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:center;">x${item.quantity}</td>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">Rs. ${Number(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}</td>
</tr>`).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;">
<thead><tr style="border-bottom:2px solid #e9ecef;">
<th style="padding:8px 0;font-size:12px;color:#6c757d;text-align:left;font-weight:600;text-transform:uppercase;">Item</th>
<th style="padding:8px 0;font-size:12px;color:#6c757d;text-align:center;font-weight:600;text-transform:uppercase;">Qty</th>
<th style="padding:8px 0;font-size:12px;color:#6c757d;text-align:right;font-weight:600;text-transform:uppercase;">Total</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

function orderSummaryBox({ subtotal, shippingFee, discount, total }) {
  const discountRow = Number(discount) > 0
    ? `<tr><td style="padding:4px 16px;font-size:14px;color:#28a745;">Discount</td><td style="padding:4px 16px;font-size:14px;color:#28a745;text-align:right;">- Rs. ${Number(discount).toLocaleString()}</td></tr>`
    : "";
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f8f9fa;border-radius:8px;">
<tr><td style="padding:12px 16px 4px;font-size:14px;color:#555;">Subtotal</td><td style="padding:12px 16px 4px;font-size:14px;color:#333;text-align:right;">Rs. ${Number(subtotal).toLocaleString()}</td></tr>
${discountRow}
<tr><td style="padding:4px 16px;font-size:14px;color:#555;">Shipping</td><td style="padding:4px 16px;font-size:14px;color:#333;text-align:right;">${Number(shippingFee) === 0 ? "Free" : `Rs. ${Number(shippingFee).toLocaleString()}`}</td></tr>
<tr><td style="padding:8px 16px 12px;font-size:16px;font-weight:700;color:#1a1a2e;border-top:2px solid #dee2e6;">Total</td><td style="padding:8px 16px 12px;font-size:16px;font-weight:700;color:#1a1a2e;text-align:right;border-top:2px solid #dee2e6;">Rs. ${Number(total).toLocaleString()}</td></tr>
</table>`;
}

// ─── Template 1: Customer Order Placed ────────────────────────────────────────

function sendOrderPlacedEmail({ customerEmail, customerName, orderId, items, pricing, companyName, logoUrl, frontendUrl }) {
  if (!customerEmail) return;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const body = `
<h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;">Order Confirmed! &#x1F389;</h2>
<p style="margin:0 0 20px;color:#555;font-size:15px;">Hi <strong>${customerName || "there"}</strong>, thank you for your order. We have received it and will start processing soon.</p>
<div style="background:#f0f8ff;border-left:4px solid #0f3460;border-radius:4px;padding:14px 18px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f3460;font-family:monospace;">#${shortId}</p>
</div>
<h3 style="margin:24px 0 8px;font-size:15px;color:#333;font-weight:600;">Items Ordered</h3>
${orderItemsTable(items)}
${orderSummaryBox(pricing)}
<div style="text-align:center;margin:28px 0;">${primaryButton("Track Your Order", `${frontendUrl}/account`)}</div>`;
  sendAsync({
    to: customerEmail,
    from: SENDGRID_FROM_EMAIL,
    subject: `Order Confirmed - #${shortId} | ${companyName}`,
    text: `Your order #${shortId} has been placed. Total: Rs. ${Number(pricing.total).toLocaleString()}`,
    html: emailWrapper(companyName, logoUrl, body)
  });
}

// ─── Template 2: Admin New Order Alert ────────────────────────────────────────

function sendAdminNewOrderEmail({ adminEmail, orderId, customerName, customerEmail, items, pricing, companyName, logoUrl, frontendUrl }) {
  if (!adminEmail) return;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const body = `
<h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;">New Order Received &#x1F4E6;</h2>
<p style="margin:0 0 20px;color:#555;font-size:15px;">A new order has been placed on <strong>${companyName}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin-bottom:20px;">
  <tr><td style="padding:12px 18px;font-size:13px;color:#777;border-bottom:1px solid #eee;">Order ID</td><td style="padding:12px 18px;font-size:14px;font-weight:600;color:#0f3460;text-align:right;border-bottom:1px solid #eee;font-family:monospace;">#${shortId}</td></tr>
  <tr><td style="padding:12px 18px;font-size:13px;color:#777;border-bottom:1px solid #eee;">Customer</td><td style="padding:12px 18px;font-size:14px;font-weight:600;color:#333;text-align:right;border-bottom:1px solid #eee;">${customerName || "Unknown"}</td></tr>
  <tr><td style="padding:12px 18px;font-size:13px;color:#777;">Email</td><td style="padding:12px 18px;font-size:14px;color:#333;text-align:right;">${customerEmail || "Unknown"}</td></tr>
</table>
<h3 style="margin:24px 0 8px;font-size:15px;color:#333;font-weight:600;">Items</h3>
${orderItemsTable(items)}
${orderSummaryBox(pricing)}
<div style="text-align:center;margin:28px 0;">${primaryButton("View Order in Dashboard", `${frontendUrl}/admin/orders`)}</div>`;
  sendAsync({
    to: adminEmail,
    from: SENDGRID_FROM_EMAIL,
    subject: `[NEW ORDER] #${shortId} - Rs. ${Number(pricing.total).toLocaleString()} | ${companyName}`,
    text: `New order #${shortId} placed by ${customerEmail}. Total: Rs. ${Number(pricing.total).toLocaleString()}`,
    html: emailWrapper(companyName, logoUrl, body)
  });
}

// ─── Template 3: Customer Order Status Update ─────────────────────────────────

const STATUS_MESSAGES = {
  processing: { emoji: "&#x2699;&#xFE0F;", headline: "Your Order is Being Processed", sub: "We are preparing your order and it will be handed to the courier soon." },
  shipped:    { emoji: "&#x1F69A;",         headline: "Your Order is On Its Way!", sub: "Great news - your order has been shipped and is heading your way." },
  cancelled:  { emoji: "&#x274C;",          headline: "Your Order Has Been Cancelled", sub: "Your order has been cancelled. Please contact us if you have any questions." }
};

function sendOrderStatusUpdateEmail({ customerEmail, customerName, orderId, newStatus, trackingNumber, courier, companyName, logoUrl, frontendUrl }) {
  if (!customerEmail) return;
  const msg = STATUS_MESSAGES[newStatus];
  if (!msg) return;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const trackingHtml = (newStatus === "shipped" && trackingNumber)
    ? `<div style="background:#e8f5e9;border-left:4px solid #28a745;border-radius:4px;padding:14px 18px;margin:20px 0;">
<p style="margin:0;font-size:13px;color:#555;">Tracking Number</p>
<p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#155724;font-family:monospace;">${trackingNumber}${courier ? ` (${courier})` : ""}</p>
</div>` : "";
  const body = `
<h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;">${msg.emoji} ${msg.headline}</h2>
<p style="margin:0 0 20px;color:#555;font-size:15px;">Hi <strong>${customerName || "there"}</strong>, ${msg.sub}</p>
<div style="background:#f0f8ff;border-left:4px solid #0f3460;border-radius:4px;padding:14px 18px;margin-bottom:20px;">
  <p style="margin:0;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f3460;font-family:monospace;">#${shortId}</p>
  <p style="margin:6px 0 0;font-size:13px;color:#555;">Status: ${statusBadge(newStatus)}</p>
</div>
${trackingHtml}
<div style="text-align:center;margin:28px 0;">${primaryButton("View My Order", `${frontendUrl}/account`)}</div>`;
  sendAsync({
    to: customerEmail,
    from: SENDGRID_FROM_EMAIL,
    subject: `Order Update: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - #${shortId} | ${companyName}`,
    text: `Your order #${shortId} is now: ${newStatus}.`,
    html: emailWrapper(companyName, logoUrl, body)
  });
}

// ─── Template 4: Delivery Confirmed + Review Request ─────────────────────────

function sendDeliveryAndReviewEmail({ customerEmail, customerName, orderId, items, companyName, logoUrl, frontendUrl }) {
  if (!customerEmail) return;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const reviewLinks = (items || []).slice(0, 3).map((item) =>
    `<a href="${frontendUrl}/product/${item.product_slug || item.product_id}" style="display:block;background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:12px 16px;margin:8px 0;text-decoration:none;color:#333;font-size:14px;">&#x2B50; Review: <strong>${item.product_name}</strong><span style="float:right;color:#0f3460;font-weight:600;">Write Review &#x2192;</span></a>`
  ).join("");
  const body = `
<h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;">Your Order Has Been Delivered! &#x1F389;</h2>
<p style="margin:0 0 20px;color:#555;font-size:15px;">Hi <strong>${customerName || "there"}</strong>, great news - your order has been delivered. We hope you love your purchase!</p>
<div style="background:#d4edda;border-left:4px solid #28a745;border-radius:4px;padding:14px 18px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#155724;font-family:monospace;">#${shortId}</p>
  <p style="margin:6px 0 0;">${statusBadge("delivered")}</p>
</div>
<div style="background:#fffbf0;border:1px solid #ffe69c;border-radius:12px;padding:24px;margin-top:24px;">
  <h3 style="margin:0 0 4px;font-size:18px;color:#856404;">&#x2B50; Share Your Experience</h3>
  <p style="margin:0 0 16px;font-size:14px;color:#6c757d;">Your feedback helps other shoppers. It only takes a minute!</p>
  ${reviewLinks}
</div>
<div style="text-align:center;margin:28px 0;">${primaryButton("View All My Orders", `${frontendUrl}/account`)}</div>`;
  sendAsync({
    to: customerEmail,
    from: SENDGRID_FROM_EMAIL,
    subject: `Delivered! How was your order? - #${shortId} | ${companyName}`,
    text: `Your order #${shortId} has been delivered. Please share your review at ${frontendUrl}/account`,
    html: emailWrapper(companyName, logoUrl, body)
  });
}

module.exports = {
  sendOrderPlacedEmail,
  sendAdminNewOrderEmail,
  sendOrderStatusUpdateEmail,
  sendDeliveryAndReviewEmail
};
