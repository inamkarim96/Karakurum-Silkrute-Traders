const { sendSuccess } = require("../../utils/apiResponse");
const notificationsService = require("./notifications.service");

async function listNotifications(req, res) {
  const { page, limit } = req.query;
  const result = await notificationsService.listNotifications({ page, limit });
  return sendSuccess(res, result);
}

async function getUnreadCount(req, res) {
  const result = await notificationsService.getUnreadCount();
  return sendSuccess(res, result);
}

async function markAsRead(req, res) {
  const notification = await notificationsService.markAsRead(req.params.id);
  return sendSuccess(res, { notification });
}

async function markAllRead(req, res) {
  const result = await notificationsService.markAllRead();
  return sendSuccess(res, result);
}

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllRead };
