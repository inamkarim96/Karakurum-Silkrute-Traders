let app;
let initError = null;

try {
  app = require("../server/src/app");
} catch (err) {
  console.error("FATAL: Failed to initialize app:", err);
  initError = err;
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.end(JSON.stringify({
      success: false,
      error: {
        code: "SERVER_INITIALIZATION_ERROR",
        message: initError.message,
        details: initError.stack
      }
    }));
  }
  return app(req, res);
};
