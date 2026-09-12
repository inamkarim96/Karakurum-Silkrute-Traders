import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { clearApiCache } from '../api/axios';
import useNotificationStore from '../store/useNotificationStore';
import { getBackendBase, getApiBase } from '../utils/apiUrl';

const BASE_URL = getBackendBase();
const API_BASE = getApiBase();

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

/**
 * Handles a NEW_ORDER push from either SSE or Socket.io.
 * Kept as a standalone function so both transports call the same logic.
 */
function handleNewOrder(data) {
  toast.success(`📦 ${data.message || data.title || 'New order received!'}`, {
    duration: 5000,
    position: 'top-right',
  });
  useNotificationStore.getState().incrementNewOrders();
  useNotificationStore.getState().fetchUnreadCount();
  clearApiCache();
  window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
}

function handleOrderDelivered(data) {
  toast.success(`🎉 ${data.title || data.message || 'Order delivered to customer!'}`, {
    duration: 5000,
    position: 'top-right',
  });
  useNotificationStore.getState().incrementNewOrders();
  useNotificationStore.getState().fetchUnreadCount();
  clearApiCache();
  window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
}

function handleOrderCancelled(data) {
  toast.error(`❌ ${data.title || data.message || 'Order cancelled'}`, {
    duration: 5000,
    position: 'top-right',
  });
  useNotificationStore.getState().incrementNewOrders();
  useNotificationStore.getState().fetchUnreadCount();
  clearApiCache();
  window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
}

/**
 * SocketProvider lives OUTSIDE the route tree (added in main.jsx) so the
 * connection is never torn down by page navigations.
 *
 * TWO notification channels are maintained:
 *
 * 1. Socket.io  – works when the backend runs as a persistent Node process
 *                 (local dev, Railway, Render, etc.)
 *
 * 2. SSE         – works on Vercel serverless where Socket.io cannot hold
 *                 persistent state. SSE is a plain HTTP response that the
 *                 serverless function keeps open while writing events.
 *                 Only opened for admin users.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const sseRef = useRef(null);

  // ─── Channel 1: Socket.io (created once, never recreated) ─────────────────
  useEffect(() => {
    const socket = io(BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.io] connected:', socket.id);
    });

    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('ORDER_DELIVERED', handleOrderDelivered);
    socket.on('ORDER_CANCELLED', handleOrderCancelled);

    socket.on('ORDER_STATUS_UPDATE', (data) => {
      toast.success(`🔄 ${data.message}`, {
        duration: 5000,
        position: 'top-right',
      });
      clearApiCache();
      window.dispatchEvent(new CustomEvent('socket:order_update', { detail: data }));
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []); // empty — created once

  // ─── Socket.io room join (re-runs when user logs in / out) ────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const joinRooms = () => {
      if (!user) return;
      if (user.id) socket.emit('join', { userId: user.id, role: user.role });
      if (user.uid && user.uid !== user.id)
        socket.emit('join', { userId: user.uid, role: user.role });
    };

    if (socket.connected) {
      joinRooms();
    } else {
      socket.once('connect', joinRooms);
    }

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [user]);

  // ─── Channel 2: SSE for admin users (Vercel-compatible) ───────────────────
  useEffect(() => {
    // Only open SSE for admin users
    if (!user || user.role !== 'admin') {
      // Close any existing SSE connection if the user is no longer admin
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    let closed = false;

    async function openSSE() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token || closed) return;

        const url = `${API_BASE}/admin/analytics/events`;
        // EventSource doesn't support custom headers natively — use a URL param
        // workaround: pass token as query param and verify on the server OR
        // use fetch-based SSE via ReadableStream for header support.
        // We use fetch + ReadableStream so we can send the Authorization header.
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          credentials: 'include',
        });

        if (!response.ok || !response.body || closed) return;

        console.log('[SSE] Admin event stream connected');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Store a "close" handle on the ref so cleanup can stop reading
        let active = true;
        sseRef.current = { close: () => { active = false; reader.cancel(); } };

        while (active && !closed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line

          let eventName = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.slice(5).trim();
            } else if (line === '' && eventName && dataStr) {
              // Full SSE message received
              try {
                const data = JSON.parse(dataStr);
                if (eventName === 'NEW_ORDER') handleNewOrder(data);
                else if (eventName === 'ORDER_DELIVERED') handleOrderDelivered(data);
                else if (eventName === 'ORDER_CANCELLED') handleOrderCancelled(data);
              } catch { /* ignore malformed */ }
              eventName = '';
              dataStr = '';
            }
          }
        }
      } catch (err) {
        if (!closed) {
          console.warn('[SSE] Connection error, retrying in 5s…', err.message);
          setTimeout(openSSE, 5000);
        }
      }
    }

    openSSE();

    return () => {
      closed = true;
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [user]); // re-runs when user changes (login/logout)

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
