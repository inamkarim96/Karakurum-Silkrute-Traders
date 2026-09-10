const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const cache = require("../../utils/cache");

const LIST_CACHE_KEY = "services:list";

async function listServices({ includeInactive = false } = {}) {
  const cacheKey = includeInactive ? "services:list:all" : LIST_CACHE_KEY;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const services = await prisma.services.findMany({
    where: includeInactive ? {} : { is_active: true },
    orderBy: { sort_order: "asc" }
  });

  await cache.set(cacheKey, services, "EX", 3600);
  return services;
}

async function getServiceById(id) {
  const service = await prisma.services.findUnique({ where: { id } });
  if (!service) {
    throw new ApiError(404, "Service not found", "SERVICE_NOT_FOUND");
  }
  return service;
}

async function createService(payload) {
  const count = await prisma.services.count();
  const service = await prisma.services.create({
    data: {
      title: payload.title,
      description: payload.description || null,
      icon: payload.icon || null,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? count
    }
  });
  await cache.clearPattern("services:list");
  return service;
}

async function updateService(id, payload) {
  const existing = await prisma.services.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Service not found", "SERVICE_NOT_FOUND");
  }

  const service = await prisma.services.update({
    where: { id },
    data: { ...payload, updated_at: new Date() }
  });
  await cache.clearPattern("services:list");
  return service;
}

async function deleteService(id) {
  const existing = await prisma.services.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Service not found", "SERVICE_NOT_FOUND");
  }
  await prisma.services.delete({ where: { id } });
  await cache.clearPattern("services:list");
}

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
