const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  phone: Joi.string().min(7).max(20).optional().allow('', null)
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

const addressSchema = Joi.object({
  full_name: Joi.string().required(),
  phone: Joi.string().min(7).max(20).required(),
  address_line: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().optional().allow(''),
  postal_code: Joi.string().optional().allow(''),
  country: Joi.string().default("PK"),
  is_default: Joi.boolean().default(false)
});

const adminStatusSchema = Joi.object({
  is_active: Joi.boolean().required()
});

const adminListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid("user", "admin", "manager").optional()
});

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  return { error, value };
}

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
  adminStatusSchema,
  adminListQuerySchema,
  validate
};
