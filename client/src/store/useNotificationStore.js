import { create } from 'zustand';
import * as notificationsApi from '../api/notifications';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  newOrdersCount: 0, // Backward compatibility for AdminLayout
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      const count = res?.data?.count ?? 0;
      set({ unreadCount: count, newOrdersCount: count });
    } catch {
      // Ignore if unauthenticated or network error
    }
  },

  fetchNotifications: async (params = {}) => {
    try {
      set({ loading: true });
      const res = await notificationsApi.getNotifications(params);
      const items = res?.data?.notifications || [];
      set({ notifications: items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markNotificationRead(id);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const unreadCount = Math.max(0, state.unreadCount - 1);
        return { notifications, unreadCount, newOrdersCount: unreadCount };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
        newOrdersCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  },

  addIncomingNotification: (item) => {
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      newOrdersCount: state.newOrdersCount + 1,
    }));
  },

  incrementNewOrders: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      newOrdersCount: state.newOrdersCount + 1,
    })),

  clearNewOrders: () => set({ newOrdersCount: 0 }),
}));

export default useNotificationStore;
