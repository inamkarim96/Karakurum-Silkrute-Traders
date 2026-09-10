const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./services.controller");

const router = express.Router();
const requireAdminForAll = (req, res, next) => {
	if (req.query.all !== "true") return next();
	return auth(req, res, (error) => {
		if (error) return next(error);
		return role("admin")(req, res, next);
	});
};

router.get("/", requireAdminForAll, asyncHandler(controller.listServices));
router.get("/:id", asyncHandler(controller.getServiceById));
router.post("/", auth, role("admin"), asyncHandler(controller.createService));
router.put("/:id", auth, role("admin"), asyncHandler(controller.updateService));
router.delete("/:id", auth, role("admin"), asyncHandler(controller.deleteService));

module.exports = router;
