import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Returns a human-friendly status label + emoji + color for each order status.
 */
function getStatusInfo(status) {
  switch ((status || '').toLowerCase()) {
    case 'processing':
      return { emoji: '⏳', label: 'Processing', color: '#f59e0b', message: 'Your order is being processed.' };
    case 'shipped':
      return { emoji: '🚚', label: 'Shipped', color: '#3b82f6', message: 'Your order is on the way!' };
    case 'delivered':
      return { emoji: '🎉', label: 'Delivered', color: '#10b981', message: 'Your order has been delivered. Enjoy!' };
    case 'cancelled':
      return { emoji: '❌', label: 'Cancelled', color: '#ef4444', message: 'Your order has been cancelled.' };
    default:
      return { emoji: '📦', label: status || 'Updated', color: '#6366f1', message: 'Your order status has been updated.' };
  }
}

/**
 * OrderStatusToast — Globally mounted for logged-in customers.
 *
 * Listens for the 'socket:order_update' custom window event dispatched by
 * SocketContext whenever an ORDER_STATUS_UPDATE is received from Socket.io.
 * Shows a rich branded toast with a link to the account / orders page.
 */
export default function OrderStatusToast() {
  const { user } = useAuth();

  useEffect(() => {
    // Only listen when a non-admin customer is logged in
    if (!user || user.role === 'admin') return;

    function handleOrderUpdate(event) {
      const data = event?.detail;
      if (!data || !data.status) return;

      const { status, orderId } = data;
      const info = getStatusInfo(status);
      const shortId = orderId ? `#${String(orderId).slice(0, 8).toUpperCase()}` : '';

      toast(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/account';
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>
              {info.emoji}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1e293b', lineHeight: 1.3 }}>
                Order {shortId} &mdash; {info.label}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                {info.message}{' '}
                <span style={{ color: info.color, fontWeight: 600 }}>View orders &rarr;</span>
              </p>
            </div>
          </div>
        ),
        {
          duration: 7000,
          position: 'bottom-right',
          style: {
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: '340px',
            border: `2px solid ${info.color}20`,
          },
          icon: null,
        }
      );
    }

    window.addEventListener('socket:order_update', handleOrderUpdate);
    return () => window.removeEventListener('socket:order_update', handleOrderUpdate);
  }, [user]);

  // Renders nothing — all output is via react-hot-toast
  return null;
}
