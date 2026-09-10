const Joi = require("joi");
const cartService = require("./cart.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");

const addItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  variant_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required()
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

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

function extractSessionId(req) {
  const signed = req.signedCookies?.nd_session;
  if (signed) return signed;

  const cookieHeader = req.headers.cookie || "";
  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  const raw = cookieParts.find((part) => part.startsWith("nd_session="));
  if (!raw) return null;

  const cookieValue = decodeURIComponent(raw.slice("nd_session=".length));
  if (cookieValue.startsWith("s:")) {
    const unsignedPart = cookieValue.slice(2).split(".")[0];
    return unsignedPart || null;
  }

  return cookieValue || null;
}

async function getCart(req, res) {
  const cart = await cartService.getCartByUserId(req.user.sub);
  return sendSuccess(res, cart);
}

async function addItem(req, res) {
  const payload = validate(addItemSchema, req.body);
  const cart = await cartService.addItem(req.user.sub, payload);
  return sendSuccess(res, cart);
}

async function updateItem(req, res) {
  const payload = validate(updateQuantitySchema, req.body);
  const cart = await cartService.updateItemQuantity(
    req.user.sub,
    req.params.itemId,
    payload.quantity
  );
  return sendSuccess(res, cart);
}

async function removeItem(req, res) {
  const cart = await cartService.removeItem(req.user.sub, req.params.itemId);
  return sendSuccess(res, cart);
}

async function clearCart(req, res) {
  const cart = await cartService.clearCart(req.user.sub);
  return sendSuccess(res, cart);
}

async function mergeCart(req, res) {
  const sessionId = extractSessionId(req);
  if (!sessionId) {
    throw new ApiError(400, "Guest session not found", "SESSION_NOT_FOUND");
  }

  const cart = await cartService.mergeGuestCart(req.user.sub, sessionId);
  return sendSuccess(res, cart);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart
};
