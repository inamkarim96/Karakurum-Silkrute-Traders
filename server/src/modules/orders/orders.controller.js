const ordersService = require("./orders.service");
const {
  createOrderSchema,
  listOwnOrdersSchema,
  adminListOrdersSchema,
  adminUpdateStatusSchema,
  validate
} = require("./orders.validation");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");

function assertValid(schema, payload) {
  const { error, value } = validate(schema, payload);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }
  return value;
}

async function listOwnOrders(req, res) {
  const query = assertValid(listOwnOrdersSchema, req.query);
  const data = await ordersService.listOwnOrders(req.user.sub, query);
  return sendSuccess(res, data);
}

async function getOwnOrder(req, res) {
  const order = await ordersService.getOwnOrder(req.user.sub, req.params.id);
  return sendSuccess(res, { order });
}

async function createOrder(req, res) {
  const payload = assertValid(createOrderSchema, req.body);
  const result = await ordersService.createOrderFromCart(req.user.sub, payload);
  return sendSuccess(res, result, 201);
}

async function cancelOwnOrder(req, res) {
  const order = await ordersService.cancelOwnOrder(req.user.sub, req.params.id);
  return sendSuccess(res, { order });
}

async function deleteOwnOrder(req, res) {
  await ordersService.deleteOwnOrder(req.user.sub, req.params.id);
  return sendSuccess(res, { message: "Order deleted from history" });
}

async function listAdminOrders(req, res) {
  const query = assertValid(adminListOrdersSchema, req.query);
  const data = await ordersService.listAdminOrders(query);
  return sendSuccess(res, data);
}

async function updateOrderStatusByAdmin(req, res) {
  const payload = assertValid(adminUpdateStatusSchema, req.body);
  const order = await ordersService.updateOrderStatusByAdmin(req.params.id, payload, req.user.sub);
  return sendSuccess(res, { order });
}

async function updateOrderAdminNotes(req, res) {
  const order = await ordersService.updateOrderAdminNotes(req.params.id, req.body.notes);
  return sendSuccess(res, { order });
}

async function getAdminOrder(req, res) {
  const order = await ordersService.getAdminOrder(req.params.id);
  return sendSuccess(res, { order });
}

module.exports = {
  listOwnOrders,
  getOwnOrder,
  createOrder,
  cancelOwnOrder,
  deleteOwnOrder,
  listAdminOrders,
  getAdminOrder,
  updateOrderStatusByAdmin,
  updateOrderAdminNotes
};
