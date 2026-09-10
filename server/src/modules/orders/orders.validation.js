const Joi = require("joi");

// Schema for each item in the fallback payload.items path.
// - price is STRIPPED (stripUnknown: true in validate()) to prevent price injection
// - variant_id must be a valid UUID if provided
// - quantity is capped at 100 per item to prevent abuse
const orderItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  variant_id: Joi.string().uuid().allow("", null).optional(),
  quantity: Joi.number().integer().min(1).max(100).required(),
  // weight is accepted as an object {id, label} from the frontend for UX,
  // but the actual price is always fetched from the DB — never trusted from client.
  weight: Joi.object({
    id: Joi.string().uuid().allow("", null).optional(),
    label: Joi.string().max(50).allow("", null).optional()
  }).optional()
  // price is intentionally omitted — will be stripped by stripUnknown
});

const createOrderSchema = Joi.object({
  shipping_address: Joi.object().required(),
  payment_method: Joi.string()
    .valid("jazzcash", "easypaisa", "stripe", "cod")
    .required(),
  coupon_code: Joi.string().trim().max(50).allow("", null).optional(),
  notes: Joi.string().trim().max(500).allow("", null).optional(),
  items: Joi.array().items(orderItemSchema).max(50).optional()
});

const listOwnOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const adminListOrdersSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  user_id: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const adminUpdateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("processing", "shipped", "delivered", "cancelled")
    .required(),
  tracking_number: Joi.string().trim().max(100).allow("", null).optional(),
  courier: Joi.string().trim().max(100).allow("", null).optional()
});

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  return { error, value };
}

module.exports = {
  createOrderSchema,
  listOwnOrdersSchema,
  adminListOrdersSchema,
  adminUpdateStatusSchema,
  validate
};
