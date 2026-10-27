const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const cache = require("../../utils/cache");

const LIST_CACHE_KEY = "testimonials:list";

async function listTestimonials({ includeInactive = false } = {}) {
  const cacheKey = includeInactive ? "testimonials:list:all" : LIST_CACHE_KEY;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const testimonials = await prisma.testimonials.findMany({
    where: includeInactive ? {} : { is_active: true },
    orderBy: [{ sort_order: "asc" }, { created_at: "desc" }]
  });

  await cache.set(cacheKey, testimonials, "EX", 3600);
  return testimonials;
}

async function getTestimonialById(id) {
  const testimonial = await prisma.testimonials.findUnique({ where: { id } });
  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found", "TESTIMONIAL_NOT_FOUND");
  }
  return testimonial;
}

async function createTestimonial(payload) {
  const count = await prisma.testimonials.count();
  const testimonial = await prisma.testimonials.create({
    data: {
      name: payload.name,
      role: payload.role,
      quote: payload.quote,
      rating: payload.rating ? Number(payload.rating) : 5,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) : count
    }
  });
  await cache.clearPattern("testimonials:list");
  return testimonial;
}

async function updateTestimonial(id, payload) {
  const existing = await prisma.testimonials.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Testimonial not found", "TESTIMONIAL_NOT_FOUND");
  }

  const testimonial = await prisma.testimonials.update({
    where: { id },
    data: {
      name: payload.name !== undefined ? payload.name : existing.name,
      role: payload.role !== undefined ? payload.role : existing.role,
      quote: payload.quote !== undefined ? payload.quote : existing.quote,
      rating: payload.rating !== undefined ? Number(payload.rating) : existing.rating,
      is_active: payload.is_active !== undefined ? payload.is_active : existing.is_active,
      sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) : existing.sort_order,
      updated_at: new Date()
    }
  });
  await cache.clearPattern("testimonials:list");
  return testimonial;
}

async function deleteTestimonial(id) {
  const existing = await prisma.testimonials.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Testimonial not found", "TESTIMONIAL_NOT_FOUND");
  }

  await prisma.testimonials.delete({ where: { id } });
  await cache.clearPattern("testimonials:list");
  return { id };
}

module.exports = {
  listTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
