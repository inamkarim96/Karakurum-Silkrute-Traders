const Joi = require("joi");
const servicesService = require("./services.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");

const createServiceSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().allow("", null).optional(),
  icon: Joi.string().trim().max(50).allow("", null).optional(),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).optional()
});

const updateServiceSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  icon: Joi.string().trim().max(50).allow("", null).optional(),
  is_active: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional()
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

async function listServices(req, res) {
  // Admin dashboard passes ?all=true to see inactive services too
  const includeInactive = req.query.all === "true";
  if (includeInactive && req.user?.role !== "admin") {
    throw new ApiError(403, "Admin access required", "FORBIDDEN");
  }
  const services = await servicesService.listServices({ includeInactive });
  res.set("Cache-Control", "public, max-age=300");
  return sendSuccess(res, { services });
}

async function getServiceById(req, res) {
  const service = await servicesService.getServiceById(req.params.id);
  return sendSuccess(res, { service });
}

async function createService(req, res) {
  const payload = validate(createServiceSchema, req.body);
  const service = await servicesService.createService(payload);
  return sendSuccess(res, { service }, 201);
}

async function updateService(req, res) {
  const payload = validate(updateServiceSchema, req.body);
  const service = await servicesService.updateService(req.params.id, payload);
  return sendSuccess(res, { service });
}

async function deleteService(req, res) {
  await servicesService.deleteService(req.params.id);
  return sendSuccess(res, { message: "Service deleted successfully" });
}

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
