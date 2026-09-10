function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || "INTERNAL_ERROR";
  const message = error.message || "Something went wrong";

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message
    }
  });
}

module.exports = {
  sendSuccess,
  sendError
};
