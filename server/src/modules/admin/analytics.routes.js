const express = require("express");
const controller = require("./analytics.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { addClient, removeClient } = require("../../utils/adminNotifier");

const router = express.Router();

router.use(auth, role("admin"));

router.get("/overview", controller.getOverview);
router.get("/revenue", controller.getRevenue);
router.get("/top-products", controller.getTopProducts);
router.get("/inventory", controller.getInventory);

/**
 * GET /api/admin/analytics/events
 *
 * Server-Sent Events stream for real-time admin notifications.
 * Works on Vercel serverless (unlike Socket.io) because SSE is just
 * a long-lived HTTP response that the function keeps writing to.
 */
router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering on some hosts
  res.flushHeaders();

  // Send a heartbeat every 25 s so the connection doesn't time out
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  addClient(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

module.exports = router;
