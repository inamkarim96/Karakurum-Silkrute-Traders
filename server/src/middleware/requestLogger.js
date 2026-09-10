const morgan = require("morgan");
const { NODE_ENV } = require("../config/env");

const requestLogger =
  NODE_ENV === "development" ? morgan("dev") : (req, res, next) => next();

module.exports = requestLogger;
