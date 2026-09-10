const Joi = require("joi");
const settingsService = require("./settings.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("../../config/env");

const updateSettingsSchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(200).optional(),
  tagline: Joi.string().trim().max(255).allow("", null).optional(),
  logo_url: Joi.string().trim().uri().allow("", null).optional(),
  address_line: Joi.string().trim().allow("", null).optional(),
  city: Joi.string().trim().max(100).allow("", null).optional(),
  email: Joi.string().trim().email().allow("", null).optional(),
  notification_email: Joi.string().trim().email().allow("", null).optional(),
  phone: Joi.string().trim().max(20).allow("", null).optional(),
  whatsapp: Joi.string().trim().max(20).allow("", null).optional(),
  facebook_url: Joi.string().trim().uri().allow("", null).optional(),
  instagram_url: Joi.string().trim().uri().allow("", null).optional(),
  map_embed_url: Joi.string().trim().allow("", null).optional(),
  footer_text: Joi.string().trim().allow("", null).optional(),
  // Page images
  hero_image_url: Joi.string().trim().uri().allow("", null).optional(),
  about_hero_image_url: Joi.string().trim().uri().allow("", null).optional(),
  about_mission_image_url: Joi.string().trim().uri().allow("", null).optional(),
  contact_hero_image_url: Joi.string().trim().uri().allow("", null).optional()
}).min(1);

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }
  return value;
}

async function getSettings(req, res) {
  const settings = await settingsService.getSettings();
  res.set("Cache-Control", "public, max-age=300");
  return sendSuccess(res, { settings });
}

async function updateSettings(req, res) {
  const payload = validate(updateSettingsSchema, req.body);
  const settings = await settingsService.updateSettings(payload);
  return sendSuccess(res, { settings });
}

/**
 * POST /settings/upload-image
 * Accepts a single image file (field name "image") and uploads it to Cloudinary
 * under KarakurumSilkruteTraders/pages/. Returns { url }.
 * Falls back gracefully if Cloudinary is not configured.
 */
async function uploadSettingsImage(req, res) {
  if (!req.file) {
    throw new ApiError(400, "No image file provided", "MISSING_FILE");
  }

  const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Image upload is not configured on this server", "UPLOAD_UNAVAILABLE");
  }

  const { uploadPageImage } = require("../../config/cloudinary");
  const filename = `page-${Date.now()}`;
  const url = await uploadPageImage(req.file.buffer, filename);

  return sendSuccess(res, { url });
}

module.exports = {
  getSettings,
  updateSettings,
  uploadSettingsImage
};
