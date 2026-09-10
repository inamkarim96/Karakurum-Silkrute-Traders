const authService = require("./auth.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { loginSchema, registerSchema, validate } = require("./auth.validation");

async function login(req, res) {
  const { error, value } = validate(loginSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  const result = await authService.login(value);
  return sendSuccess(res, result);
}

async function register(req, res) {
  const { error, value } = validate(registerSchema, req.body);
  if (error) throw new ApiError(400, error.message, "VALIDATION_ERROR");
  const result = await authService.register(value);
  return sendSuccess(res, result, 201);
}

module.exports = {
  login,
  register
};
