/**
 * notifications.service.js
 *
 * Manages persistent admin notifications stored in the `notifications` table.
 * Every write also fires an SSE push so the admin bell updates in real-time
 * without a page refresh.
 */

const prisma = require("../../config/prisma");
const { notifyAdmins } = require("../../utils/adminNotifier");
const ApiError = require("../../utils/apiError");

const PAGE_SIZE = 20;

/**
 * Persist a notification to the DB and immediately push it via SSE.
 * Fire-and-forget safe — never throws, only logs errors.
 *
 * @param {object} opts
 * @param {string} opts.type    - e.g. "NEW_ORDER", "ORDER_DELIVERED"
 * @param {string} opts.title   - Short headline shown in the bell panel
 * @param {string} [opts.body]  - Optional longer description
 * @param {object} [opts.data]  - Extra JSON payload (orderId, total, etc.)
 */
async function createNotification({ type, title, body, data }) {
  try {
    const notification = await prisma.notifications.create({
      data: { type, title, body: body || null, data: data || null }
    });

    // Real-time push to all connected admin SSE clients
    notifyAdmins(type, {
      notificationId: notification.id,
      title,
      body,
      data,
      created_at: notification.created_at
    });

    return notification;
  } catch (err) {
    console.error("[notifications.service] createNotification failed:", err?.message || err);
  }
}

/**
 * List all admin notifications, newest first.
 */
async function listNotifications({ page = 1, limit = PAGE_SIZE } = {}) {
  const pageNum = Number(page);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const [total, rows] = await Promise.all([
    prisma.notifications.count(),
    prisma.notifications.findMany({
      orderBy: { created_at: "desc" },
      take: limitNum,
      skip
    })
  ]);

  return {
    notifications: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };
}

/**
 * Returns the count of unread notifications — used for the bell badge.
 */
async function getUnreadCount() {
  const count = await prisma.notifications.count({ where: { is_read: false } });
  return { count };
}

/**
 * Mark a single notification as read.
 */
async function markAsRead(notificationId) {
  const existing = await prisma.notifications.findUnique({ where: { id: notificationId } });
  if (!existing) throw new ApiError(404, "Notification not found", "NOT_FOUND");

  return prisma.notifications.update({
    where: { id: notificationId },
    data: { is_read: true }
  });
}

/**
 * Mark ALL notifications as read — used by "Clear all" button.
 */
async function markAllRead() {
  await prisma.notifications.updateMany({
    where: { is_read: false },
    data: { is_read: true }
  });
  return { success: true };
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead
};
