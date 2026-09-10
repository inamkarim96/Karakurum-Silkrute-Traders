const { sendSuccess } = require("../../utils/apiResponse");
const ApiError = require("../../utils/apiError");
const usersService = require("./users.service");
const {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
  adminStatusSchema,
  adminListQuerySchema,
  validate
} = require("./users.validation");

async function getProfile(req, res) {
  const user = await usersService.getProfile(req.user.sub);
  sendSuccess(res, user);
}

async function updateProfile(req, res) {
  const { error, value } = validate(updateProfileSchema, req.body);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  const user = await usersService.updateProfile(req.user.sub, value);
  sendSuccess(res, user);
}

async function changePassword(req, res) {
  const { error, value } = validate(changePasswordSchema, req.body);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  await usersService.changePassword(req.user.sub, value.current_password, value.new_password);
  sendSuccess(res, { message: "Password updated successfully" });
}

async function getAddresses(req, res) {
  const addresses = await usersService.getAddresses(req.user.sub);
  sendSuccess(res, addresses);
}

async function addAddress(req, res) {
  const { error, value } = validate(addressSchema, req.body);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  const address = await usersService.addAddress(req.user.sub, value);
  sendSuccess(res, address, 201);
}

async function updateAddress(req, res) {
  const { error, value } = validate(addressSchema, req.body);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  const address = await usersService.updateAddress(req.user.sub, req.params.id, value);
  sendSuccess(res, address);
}

async function deleteAddress(req, res) {
  await usersService.deleteAddress(req.user.sub, req.params.id);
  res.status(204).send();
}

async function listUsers(req, res) {
  const { error, value } = validate(adminListQuerySchema, req.query);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  const result = await usersService.listUsers(value);
  sendSuccess(res, result);
}

async function getUserDetails(req, res) {
  const user = await usersService.getUserDetails(req.params.id);
  sendSuccess(res, user);
}

async function updateUserStatus(req, res) {
  const { error, value } = validate(adminStatusSchema, req.body);
  if (error) {
    throw new ApiError(400, "Validation Error", "VALIDATION_ERROR", error.details);
  }
  const user = await usersService.updateUserStatus(req.params.id, value.is_active);
  sendSuccess(res, user);
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUserDetails,
  updateUserStatus
};
