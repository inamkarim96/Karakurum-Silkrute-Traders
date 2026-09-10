import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import useNotificationStore from '../../store/useNotificationStore';

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
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 30s as a fallback
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    navigate('/admin/orders');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NEW_ORDER':
        return <Package size={18} className="text-emerald-500" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle2 size={18} className="text-blue-500" />;
      case 'ORDER_CANCELLED':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={22} className={unreadCount > 0 ? 'text-slate-800' : 'text-slate-500'} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  You'll be alerted when customers place or cancel orders, or when items are delivered.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                    !notif.is_read ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 p-2 rounded-xl bg-slate-100">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    )}
                  </div>
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/orders');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View all orders <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
