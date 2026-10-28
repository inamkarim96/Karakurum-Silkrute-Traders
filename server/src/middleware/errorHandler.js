const { NODE_ENV } = require("../config/env");
const { sendError } = require("../utils/apiResponse");

const DB_ERROR_NAMES = new Set([
  "MongooseServerSelectionError",
  "MongoServerSelectionError",
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoTimeoutError",
  "MongoNotConnectedError",
  "MongoTopologyClosedError"
]);

function isDatabaseError(error) {
  if (!error) return false;
  if (error.errorCode === "DATABASE_UNAVAILABLE") return true;
  if (DB_ERROR_NAMES.has(error.name)) return true;

  const message = String(error.message || "");
  return (
    /MongoDB Atlas cluster/i.test(message) ||
    /buffering timed out/i.test(message) ||
    /^querySrv/i.test(message) ||
    /ECONNREFUSED.*27017/i.test(message) ||
    /getaddrinfo.*mongodb/i.test(message) ||
    /bad auth/i.test(message)
  );
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  // Database connectivity problems are not internal bugs: report them as 503
  // so clients can retry, and never leak Atlas/cluster details in production.
  if (isDatabaseError(error)) {
    console.error(
      `[db] ${req.method} ${req.originalUrl} — database unavailable: ${error.name}: ${error.message}`
    );

    const message =
      error.errorCode === "DATABASE_UNAVAILABLE"
        ? error.message
        : NODE_ENV === "production"
          ? "The database is temporarily unavailable. Please try again in a moment."
          : `Database unavailable: ${error.message}`;

    return sendError(res, {
      statusCode: 503,
      errorCode: "DATABASE_UNAVAILABLE",
      message
    });
  }

  if (NODE_ENV !== "production") {
    console.error(error);
  }

  return sendError(res, {
    statusCode: error.statusCode || 500,
    errorCode: error.errorCode || "INTERNAL_ERROR",
    message: error.message || "Internal Server Error"
  });
}

module.exports = errorHandler;
