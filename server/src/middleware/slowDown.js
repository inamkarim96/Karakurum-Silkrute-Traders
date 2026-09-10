const slowDown = require("express-slow-down");

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: (hits) => (hits - 50) * 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // limit maximum delay to 20 seconds
});

module.exports = speedLimiter;
