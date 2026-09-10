const ApiError = require("../utils/apiError");

function role(requiredRole) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
    }

    if (req.user.role !== requiredRole) {
      return next(new ApiError(403, "Forbidden", "FORBIDDEN"));
    }

    return next();
  };
}

module.exports = role;
