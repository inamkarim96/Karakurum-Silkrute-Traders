const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./testimonials.controller");

const router = express.Router();

const requireAdminForAll = (req, res, next) => {
  if (req.query.all !== "true") return next();
  return auth(req, res, (error) => {
    if (error) return next(error);
    return role("admin")(req, res, next);
  });
};

router.get("/", requireAdminForAll, asyncHandler(controller.listTestimonials));
router.get("/:id", asyncHandler(controller.getTestimonialById));
router.post("/", auth, role("admin"), asyncHandler(controller.createTestimonial));
router.put("/:id", auth, role("admin"), asyncHandler(controller.updateTestimonial));
router.delete("/:id", auth, role("admin"), asyncHandler(controller.deleteTestimonial));

module.exports = router;
