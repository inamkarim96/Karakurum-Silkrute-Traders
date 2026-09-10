/**
 * adminNotifier.js
 *
 * A lightweight, in-process publish/subscribe bus for pushing real-time events
 * to connected admin browsers via Server-Sent Events (SSE).
 *
 * WHY SSE instead of Socket.io?
 * ─────────────────────────────
 * The backend is deployed on Vercel as a serverless function (api/index.js
 * exports the Express app directly). Vercel serverless functions are
 * stateless — there is no persistent process to keep Socket.io rooms alive.
 * SSE is a plain HTTP response that stays open for as long as the function
 * keeps writing to it, which Vercel fully supports.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Admin browser calls  GET /api/admin/events  (with Authorization header).
 * 2. The SSE endpoint registers the response object here and keeps it open.
 * 3. When createOrderFromCart() calls notifyAdmins(), every registered
 *    response object receives an SSE-formatted message.
 * 4. If the admin disconnects (browser closed / refresh), the 'close' event
 *    on req removes the response from the set.
 */

/** @type {Set<import('express').Response>} */
const adminClients = new Set();

/**
 * Register a new SSE response object for an admin connection.
 * @param {import('express').Response} res
 */
function addClient(res) {
  adminClients.add(res);
}

/**
 * Remove an SSE response object (called when the connection closes).
 * @param {import('express').Response} res
 */
function removeClient(res) {
  adminClients.delete(res);
}

/**
 * Broadcast an event to every connected admin browser.
 * @param {string} event  – SSE event name (e.g. "NEW_ORDER")
 * @param {object} data   – JSON-serialisable payload
 */
function notifyAdmins(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of adminClients) {
    try {
      res.write(payload);
    } catch {
      adminClients.delete(res);
    }
  }
}

module.exports = { addClient, removeClient, notifyAdmins };
