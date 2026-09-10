const { NODE_ENV } = require("../config/env");
const { sendError } = require("../utils/apiResponse");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
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
