const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { productImageUpload, teamPhotoUpload } = require("../../config/cloudinary");
const controller = require("./team.controller");

const router = express.Router();
const requireAdminForAll = (req, res, next) => {
	if (req.query.all !== "true") return next();
	return auth(req, res, (error) => {
		if (error) return next(error);
		return role("admin")(req, res, next);
	});
};

router.get("/", requireAdminForAll, asyncHandler(controller.listTeamMembers));
router.get("/:id", asyncHandler(controller.getTeamMemberById));
router.post(
  "/",
  auth,
  role("admin"),
  teamPhotoUpload,
  asyncHandler(controller.createTeamMember)
);
router.put(
  "/:id",
  auth,
  role("admin"),
  teamPhotoUpload,
  asyncHandler(controller.updateTeamMember)
);
router.delete("/:id", auth, role("admin"), asyncHandler(controller.deleteTeamMember));

module.exports = router;
