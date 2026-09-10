const Joi = require("joi");
const categoriesService = require("./categories.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { uploadCategoryImage: uploadCategoryImageToCloudinary } = require("../../config/cloudinary");
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("../../config/env");

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  image: Joi.string().trim().uri().allow("", null).optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  image: Joi.string().trim().uri().allow("", null).optional()
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

async function listCategories(req, res) {
  const categories = await categoriesService.listCategories();
  res.set("Cache-Control", "public, max-age=300");
  return sendSuccess(res, { categories });
}

async function getCategoryById(req, res) {
  const category = await categoriesService.getCategoryById(req.params.id);
  return sendSuccess(res, { category });
}

async function createCategory(req, res) {
  const payload = validate(createCategorySchema, req.body);
  const category = await categoriesService.createCategory(payload);
  return sendSuccess(res, { category }, 201);
}

async function updateCategory(req, res) {
  const payload = validate(updateCategorySchema, req.body);
  const category = await categoriesService.updateCategory(req.params.id, payload);
  return sendSuccess(res, { category });
}

async function deleteCategory(req, res) {
  await categoriesService.deleteCategory(req.params.id);
  return sendSuccess(res, { message: "Category deleted successfully" });
}

async function initializeCategories(req, res) {
  const result = await categoriesService.initializeDefaults();
  return sendSuccess(res, result);
}

async function uploadCategoryImage(req, res) {
  if (!req.file) {
    throw new ApiError(400, "No image file provided", "MISSING_FILE");
  }

  const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Image upload is not configured on this server", "UPLOAD_UNAVAILABLE");
  }

  const filename = `cat-${req.params.id}-${Date.now()}`;
  const url = await uploadCategoryImageToCloudinary(req.file.buffer, filename);

  const updated = await categoriesService.updateCategory(req.params.id, { image: url });
  return sendSuccess(res, { url, category: updated });
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  initializeCategories,
  uploadCategoryImage
};
