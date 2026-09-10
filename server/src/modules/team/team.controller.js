const Joi = require("joi");
const teamService = require("./team.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("../../config/env");

const createTeamMemberSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  title: Joi.string().trim().min(2).max(100).required(),
  photo_url: Joi.string().trim().uri().allow("", null).optional(),
  bio: Joi.string().trim().allow("", null).optional(),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).optional()
});

const updateTeamMemberSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  title: Joi.string().trim().min(2).max(100).optional(),
  photo_url: Joi.string().trim().uri().allow("", null).optional(),
  bio: Joi.string().trim().allow("", null).optional(),
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

async function listTeamMembers(req, res) {
  const includeInactive = req.query.all === "true";
  if (includeInactive && req.user?.role !== "admin") {
    throw new ApiError(403, "Admin access required", "FORBIDDEN");
  }
  const members = await teamService.listTeamMembers({ includeInactive });
  res.set("Cache-Control", "public, max-age=300");
  return sendSuccess(res, { team: members });
}

async function getTeamMemberById(req, res) {
  const member = await teamService.getTeamMemberById(req.params.id);
  return sendSuccess(res, { member });
}

async function createTeamMember(req, res) {
  // Handle photo file upload if present (multer makes it available as req.file)
  // If Cloudinary is not configured, fall back to using photo_url from body
  let photoUrl = req.body.photo_url;

  if (req.file) {
    try {
      const cloudinaryConfig = require("../../config/cloudinary");
      // Check if Cloudinary is configured with valid credentials
      const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;
      if (isCloudinaryConfigured) {
        const filename = `team-${req.body.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        const result = await cloudinaryConfig.cloudinary.uploader.upload(
          `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`,
          {
            folder: "KarakurumSilkruteTraders/team",
            resource_type: "image",
            public_id: filename
          }
        );
        photoUrl = result.secure_url;
      } else {
        console.log('Cloudinary not configured, using photo_url as-is');
        photoUrl = req.body.photo_url || null;
      }
    } catch (err) {
      console.error('Team photo upload error:', err.message);
      // If upload fails, continue without photo
      photoUrl = req.body.photo_url || null;
    }
  } else if (!photoUrl) {
    photoUrl = null;
  }

  const payload = {
    name: req.body.name,
    title: req.body.title,
    photo_url: photoUrl,
    bio: req.body.bio || null,
    is_active: req.body.is_active !== false,
    sort_order: req.body.sort_order
  };

  const member = await teamService.createTeamMember(payload);
  return sendSuccess(res, { member }, 201);
}

async function updateTeamMember(req, res) {
  // Handle photo file upload if present
  let photoUrl = req.body.photo_url;

  if (req.file) {
    try {
      const cloudinaryConfig = require("../../config/cloudinary");
      // Check if Cloudinary is configured with valid credentials
      const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;
      if (isCloudinaryConfigured) {
        const filename = `team-${Date.now()}`;
        const result = await cloudinaryConfig.cloudinary.uploader.upload(
          `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`,
          {
            folder: "KarakurumSilkruteTraders/team",
            resource_type: "image",
            public_id: filename
          }
        );
        photoUrl = result.secure_url;
      } else {
        console.log('Cloudinary not configured, using photo_url as-is');
        photoUrl = req.body.photo_url || null;
      }
    } catch (err) {
      console.error('Team photo upload error:', err.message);
      photoUrl = req.body.photo_url || null;
    }
  }

  const payload = {
    name: req.body.name,
    title: req.body.title,
    photo_url: photoUrl,
    bio: req.body.bio || null,
    is_active: req.body.is_active !== false,
    sort_order: req.body.sort_order
  };

  const member = await teamService.updateTeamMember(req.params.id, payload);
  return sendSuccess(res, { member });
}

async function deleteTeamMember(req, res) {
  await teamService.deleteTeamMember(req.params.id);
  return sendSuccess(res, { message: "Team member deleted successfully" });
}

module.exports = {
  listTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};