import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Bell,
  CheckCheck,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Badge } from '../components/ui';
import useNotificationStore from '../store/useNotificationStore';

import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    fetchNotifications,
    markAllAsRead,
  } = useNotificationStore();

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [overviewRes, inventoryRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/inventory'),
        api.get('/admin/orders?limit=5')
      ]);
      
      if (overviewRes.data?.success) setOverview(overviewRes.data.data);
      if (inventoryRes.data?.success) setInventory(inventoryRes.data.data || []);
      if (ordersRes.data?.success) setRecentOrders(ordersRes.data.data.orders || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Unable to load dashboard data. Please refresh the page.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    fetchNotifications({ limit: 5 });

    const handleSocketUpdate = () => {
      fetchDashboardData(false);
      fetchNotifications({ limit: 5 });
    };

    window.addEventListener('socket:order_update', handleSocketUpdate);
    return () => {
      window.removeEventListener('socket:order_update', handleSocketUpdate);
    };
  }, [fetchNotifications]);

  const stats = [
    {
      name: 'Total Revenue',
      value: overview ? `PKR ${Number(overview.total_revenue || 0).toLocaleString()}` : '—',
      icon: <TrendingUp size={24} />,
    },
    {
      name: 'Active Customers',
      value: overview ? overview.total_customers?.toLocaleString() : '—',
      icon: <Users size={24} />,
    },
    {
      name: 'Total Orders',
      value: overview ? overview.total_orders?.toLocaleString() : '—',
      icon: <ShoppingCart size={24} />,
    },
    {
      name: 'Low Stock Products',
      value: overview ? overview.low_stock_products?.toLocaleString() : '—',
      icon: <Package size={24} />,
    },
  ];

  const getNotifIcon = (type) => {
    if (type === 'NEW_ORDER') return <Package size={16} className="text-emerald-500" />;
    if (type === 'ORDER_DELIVERED') return <CheckCircle2 size={16} className="text-blue-500" />;
    if (type === 'ORDER_CANCELLED') return <XCircle size={16} className="text-red-500" />;
    return <Bell size={16} className="text-amber-500" />;
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Store Dashboard</h1>
        <Button variant="admin-outline" size="sm" onClick={() => window.print()}>Download Report</Button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.name} 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-details">
              <span>{stat.name}</span>
              <h3>{loading ? '—' : stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="text-btn">View All Orders</Link>
          </div>
          <div className="admin-table-container">
            {loading ? (
              <p className="state-msg">Loading recent orders...</p>
            ) : recentOrders.length === 0 ? (
              <p className="state-msg">No recent orders.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id.substring(0, 8)}</strong></td>
                      <td>{order.user_name}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>PKR {Number(order.total).toLocaleString()}</td>
                      <td>
                        <Badge variant={
                          order.status.toLowerCase() === 'delivered' ? 'success' : 
                          order.status.toLowerCase() === 'cancelled' ? 'error' : 'info'
                        }>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Low Stock Alerts</h2>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <div className="alerts-list">
            {loading ? (
              <p className="state-msg">Loading inventory alerts...</p>
            ) : inventory.length === 0 ? (
              <p className="state-msg text-green-600">All products are well stocked!</p>
            ) : (
              inventory.slice(0, 5).map((item, idx) => (
                <div key={idx} className="alert-item">
                  <div className="alert-info">
                    <strong>{item.product_name} ({item.variant_label})</strong>
                    <span>Only {item.stock} left in stock</span>
                  </div>
                  <Button 
                    as={Link} 
                    to="/admin/products" 
                    variant="admin-ghost" 
                    size="sm" 
                    className="no-underline text-center"
                  >
                    Restock
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Recent Notifications Panel ─────────────────────────────── */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Recent Notifications</h2>
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px'
                }}>{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                title="Mark all as read"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className="alerts-list">
            {notifLoading && notifications.length === 0 ? (
              <p className="state-msg">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="state-msg">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <Link key={notif.id} to="/admin/orders" style={{ textDecoration: 'none' }}>
                  <div className="alert-item" style={{ opacity: notif.is_read ? 0.65 : 1 }}>
                    <div className="alert-info" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0 }}>{getNotifIcon(notif.type)}</span>
                      <div>
                        <strong style={{ fontSize: '13px' }}>{notif.title}</strong>
                        {notif.body && <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{notif.body}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default AdminDashboard;
