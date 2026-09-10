import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useNotificationStore from '../store/useNotificationStore';
import {
  LayoutDashboard as RxDashboard,
  Package as FiPackage,
  ShoppingBag as FiShoppingBag,
  Users as FiUsers,
  LogOut,
  FolderOpen,
  Settings,
  Briefcase,
  Users2,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { getSettings } from '../api/site';
import NotificationBell from '../components/admin/NotificationBell';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { newOrdersCount, clearNewOrders } = useNotificationStore();

  useEffect(() => {
    getSettings().then((response) => {
      // Company name is used directly in the UI, no need to store in state
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/orders') {
      clearNewOrders();
    }
  }, [location.pathname, clearNewOrders]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`admin-layout-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <Link to="/" className="admin-sidebar-logo">
          <FiPackage size={24} /> Karakurum Silkrute Traders
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <NotificationBell />
          <button onClick={toggleSidebar} className="mobile-toggle">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-sidebar-logo">
            <FiPackage size={28} /> Karakurum Silkrute Traders
          </Link>
          <div className="text-emerald-300 text-xs mt-1">Admin Panel</div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          {[
            { to: '/admin', icon: RxDashboard, label: 'Dashboard', end: true },
            { to: '/admin/products', icon: FiPackage, label: 'Products' },
            { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
            { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders', showBadge: true },
            { to: '/admin/users', icon: FiUsers, label: 'Users' },
            { to: '/admin/services', icon: Briefcase, label: 'Services' },
            { to: '/admin/team', icon: Users2, label: 'Team' }
          ].map(({ to, icon: Icon, label, end, showBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="flex items-center w-full">
                <Icon size={20} className="mr-3" />
                <span>{label}</span>
                {showBadge && newOrdersCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {newOrdersCount}
                  </span>
                )}
              </div>
            </NavLink>
          ))}
          <NavLink
            to="/admin/settings"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} /> Settings
          </NavLink>
        </nav>

        {/* Footer actions */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link text-emerald-200">
            <ArrowLeft size={20} /> Back to Shop
          </Link>
          <button onClick={logout} className="admin-nav-link text-red-300 bg-transparent border-none cursor-pointer w-full text-left">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>
        <main className="admin-main-content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
