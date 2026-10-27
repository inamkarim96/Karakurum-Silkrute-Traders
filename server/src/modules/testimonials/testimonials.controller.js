const { sendSuccess } = require("../../utils/apiResponse");
const testimonialsService = require("./testimonials.service");

async function listTestimonials(req, res) {
  const includeInactive = req.query.all === "true";
  const testimonials = await testimonialsService.listTestimonials({ includeInactive });
  sendSuccess(res, { testimonials });
}

async function getTestimonialById(req, res) {
  const testimonial = await testimonialsService.getTestimonialById(req.params.id);
  sendSuccess(res, { testimonial });
}

async function createTestimonial(req, res) {
  const { name, role, quote, rating, is_active, sort_order } = req.body;
  if (!name || !quote) {
    return res.status(400).json({ success: false, message: "Name and quote are required" });
  }

  const testimonial = await testimonialsService.createTestimonial({
    name,
    role: role || "Customer",
    quote,
    rating,
    is_active,
    sort_order
  });
  sendSuccess(res, { testimonial }, 201);
}

async function updateTestimonial(req, res) {
  const testimonial = await testimonialsService.updateTestimonial(req.params.id, req.body);
  sendSuccess(res, { testimonial });
}

async function deleteTestimonial(req, res) {
  const result = await testimonialsService.deleteTestimonial(req.params.id);
  sendSuccess(res, result);
}

module.exports = {
  listTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
