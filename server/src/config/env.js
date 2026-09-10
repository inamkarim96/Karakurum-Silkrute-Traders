const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  DATABASE_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  BACKEND_URL: Joi.string().uri().default("http://localhost:8080"),

  CLOUDINARY_CLOUD_NAME: Joi.string().allow("").optional(),
  CLOUDINARY_API_KEY: Joi.string().allow("").optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow("").optional(),
  SENDGRID_API_KEY: Joi.string().allow("").optional(),
  SENDGRID_FROM_EMAIL: Joi.string().email().allow("").optional(),
  JAZZCASH_MERCHANT_ID: Joi.string().allow("").optional(),
  JAZZCASH_PASSWORD: Joi.string().allow("").optional(),
  JAZZCASH_INTEGRITY_SALT: Joi.string().allow("").optional(),
  STRIPE_SECRET_KEY: Joi.string().allow("").optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow("").optional(),
  GOOGLE_CLIENT_ID: Joi.string().allow("").optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow("").optional(),
  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PHONE: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),
  SESSION_SECRET: Joi.string().min(16).default("development-session-secret-change-me")
})
  .unknown()
  .required();

const { error, value } = schema.validate(process.env, {
  abortEarly: false,
  convert: true
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  BACKEND_URL,

  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  JAZZCASH_MERCHANT_ID,
  JAZZCASH_PASSWORD,
  JAZZCASH_INTEGRITY_SALT,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PHONE,
  ADMIN_PASSWORD,
  SESSION_SECRET
} = value;

module.exports = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  BACKEND_URL,

  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  JAZZCASH_MERCHANT_ID,
  JAZZCASH_PASSWORD,
  JAZZCASH_INTEGRITY_SALT,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PHONE,
  ADMIN_PASSWORD,
  SESSION_SECRET
};