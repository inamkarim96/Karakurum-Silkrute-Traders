const Joi = require("joi");

const passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('').optional(),
  country: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be at least 8 characters and include one uppercase letter and one special character"
  })
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().pattern(/^\d{6}$/).required()
});

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });

  return { error, value };
}

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  validate
};
