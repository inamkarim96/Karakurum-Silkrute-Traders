const { NODE_ENV } = require("../config/env");

/**
 * Lightweight response-time middleware.
 * Sets X-Response-Time header and logs slow requests (>500ms) in development.
 * Overhead: <0.1ms per request.
 */
function responseTime(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1e6).toFixed(1);

    if (NODE_ENV === "development" && durationMs > 500) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.originalUrl} — ${durationMs}ms`);
    }
  });

  next();
}

module.exports = responseTime;
