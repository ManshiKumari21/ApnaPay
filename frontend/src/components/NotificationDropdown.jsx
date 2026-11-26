import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import {
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  RefreshCwIcon,
  XIcon,
  BankIcon,
  ShieldIcon,
  LayersIcon,
  WalletIcon,
  LockIcon,
  ShieldCheckIcon,
  InfoIcon
} from './Icons';

/**
 * Format timestamp to friendly relative time
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSecs = Math.floor((now - date) / 1000);

  if (diffInSecs < 60) return 'Just now';
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Get category metadata for UI styling
 */
const getCategoryMeta = (category) => {
  switch (category) {
    case 'bank':
      return { label: 'Bank Account', color: '#00A8FF', bg: 'rgba(0, 168, 255, 0.14)', icon: BankIcon };
    case 'upi':
      return { label: 'UPI Handle', color: '#00E599', bg: 'rgba(0, 229, 153, 0.14)', icon: ShieldIcon };
    case 'digital_land':
      return { label: 'Digital Land', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.14)', icon: LayersIcon };
    case 'wallet':
    case 'payment':
      return { label: 'Wallet & Ledger', color: '#087BFF', bg: 'rgba(8, 123, 255, 0.14)', icon: WalletIcon };
    case 'security':
      return { label: 'Security Alert', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', icon: LockIcon };
    case 'kyc':
      return { label: 'KYC & Compliance', color: '#00D5FF', bg: 'rgba(0, 213, 255, 0.14)', icon: ShieldCheckIcon };
    default:
      return { label: 'General Alert', color: '#A9BDD7', bg: 'rgba(169, 189, 215, 0.14)', icon: BellIcon };
  }
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const loadNotifications = async (status = filter, showSpinner = true) => {
    if (status === 'preferences') return;
    const userToken = localStorage.getItem('apnapay_token');
    if (!userToken) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await notificationService.getNotifications({
        page: 1,
        limit: 25,
        status
      });

      if (res && res.success) {
        setNotifications(res.data?.records || []);
        setUnreadCount(typeof res.data?.unreadCount === 'number' ? res.data.unreadCount : 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err?.response?.data?.message || err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Fetch notification preferences
  const loadPreferences = async () => {
    const userToken = localStorage.getItem('apnapay_token');
    if (!userToken) return;
    setLoading(true);
    try {
      const res = await notificationService.getPreferences();
      setPreferences(res?.data || null);
    } catch (err) {
      console.warn('Failed to fetch preferences:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load, background polling (12s), and window focus synchronization
  useEffect(() => {
    loadNotifications(filter, false);
    const interval = setInterval(() => {
      loadNotifications(filter, false);
    }, 12000); // 12 sec active sync

    const handleFocus = () => {
      loadNotifications(filter, false);
    };
    const handleToggle = () => {
      setIsOpen((prev) => {
        const next = !prev;
        if (next) loadNotifications(filter, false);
        return next;
      });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('toggle-alerts-dropdown', handleToggle);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('toggle-alerts-dropdown', handleToggle);
    };
  }, [filter]);

  // Handle outside click & ESC key to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: 1, read_at: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Handle clicking a notification item: mark as read and navigate to relevant section
  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read on click:', err);
      }
    }

    setIsOpen(false);

    // Deep navigation based on notification category & type
    const notifType = String(item.notification_type || item.reference_type || '').toUpperCase();
    if (
      item.category === 'digital_land' ||
      notifType.includes('LAND_ORDER') ||
      item.title?.toLowerCase().includes('land')
    ) {
      navigate('/app/land', {
        state: {
          activeTab: 'transactions',
          orderRef: item.reference_id,
          orderId: item.reference_id
        }
      });
    } else if (item.category === 'bank') {
      navigate('/app/banks');
    } else if (item.category === 'upi') {
      navigate('/app/upi');
    } else if (item.category === 'wallet' || item.category === 'payment') {
      navigate('/app/wallet');
    } else if (item.category === 'security') {
      navigate('/app/profile');
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: 1, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) loadNotifications(filter, true);
        }}
        className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <div className="notification-panel-title-wrap">
              <div className="notification-panel-title-icon">
                <BellIcon size={16} />
              </div>
              <h2 className="notification-panel-title">Notifications</h2>
              {unreadCount > 0 && (
                <span className="notification-unread-count-pill">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="notification-panel-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading}
                  className="notification-header-action-btn"
                  title="Mark all as read"
                >
                  <CheckCheckIcon size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => loadNotifications(filter, true)}
                className="notification-icon-btn"
                title="Refresh notifications"
              >
                <RefreshCwIcon size={14} className={loading ? 'spin' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="notification-icon-btn"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notification-panel-tabs">
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                loadNotifications('all', true);
              }}
              className={`notification-tab-btn ${filter === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('unread');
                loadNotifications('unread', true);
              }}
              className={`notification-tab-btn ${filter === 'unread' ? 'active' : ''}`}
            >
              <span>Unread</span>
              {unreadCount > 0 && <span className="notification-tab-dot" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('preferences');
                loadPreferences();
              }}
              className={`notification-tab-btn ${filter === 'preferences' ? 'active' : ''}`}
            >
              Preferences
            </button>
          </div>

          {/* List Area */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-empty-state">
                <RefreshCwIcon size={24} style={{ color: '#00A8FF', marginBottom: '8px' }} className="spin" />
                <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                  {filter === 'preferences' ? 'Loading preferences...' : 'Loading notifications...'}
                </span>
              </div>
            ) : filter === 'preferences' ? (
              <div className="notification-preferences-list">
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#00D5FF', marginBottom: '4px' }}>
                  Active Notification Subscriptions
                </div>
                {[
                  { key: 'paymentNotifications', label: 'Payment & Settlements' },
                  { key: 'walletNotifications', label: 'Wallet & Escrow Ledger' },
                  { key: 'bankNotifications', label: 'Bank Account Alerts' },
                  { key: 'upiNotifications', label: 'UPI Handle Activity' },
                  { key: 'securityNotifications', label: 'Security & 2FA Alerts' },
                  { key: 'digitalLandNotifications', label: 'Digital Land Orders' },
                  { key: 'kycNotifications', label: 'KYC & Compliance' },
                  { key: 'generalNotifications', label: 'General Updates' }
                ].map((item) => (
                  <div key={item.key} className="notification-pref-item">
                    <span className="notification-pref-label">{item.label}</span>
                    <span className="notification-pref-badge">
                      ● Subscribed
                    </span>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state">
                <div className="notification-empty-icon">
                  <BellIcon size={22} />
                </div>
                <p className="notification-empty-title">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="notification-empty-desc">
                  {filter === 'unread'
                    ? 'All your notifications have been marked as read.'
                    : 'System alerts and activity updates will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getCategoryMeta(item.category);
                const Icon = meta.icon;
                const isUnread = !item.is_read;

                const notifType = String(item.notification_type || item.reference_type || '').toUpperCase();
                const isApproved = notifType.includes('APPROVED') || item.title?.toLowerCase().includes('approved') || item.type === 'success';
                const isRejected = notifType.includes('REJECTED') || item.title?.toLowerCase().includes('rejected') || item.type === 'error';
                const isPending = notifType.includes('SUBMITTED') || notifType.includes('PENDING') || item.title?.toLowerCase().includes('submitted');

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                  >
                    {/* Category Icon */}
                    <div
                      className="notification-icon-wrap"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <div className="notification-top-row">
                        <div className="notification-badges-group">
                          <span
                            className="notification-category-badge"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>

                          {/* Visual Status Tag */}
                          {isApproved && (
                            <span className="notification-status-badge approved">
                              ● APPROVED
                            </span>
                          )}
                          {isRejected && (
                            <span className="notification-status-badge rejected">
                              ● REJECTED
                            </span>
                          )}
                          {isPending && (
                            <span className="notification-status-badge pending">
                              ● PENDING
                            </span>
                          )}
                        </div>

                        <div className="notification-time-wrap">
                          <span className="notification-time">
                            {formatRelativeTime(item.created_at)}
                          </span>
                          {isUnread && (
                            <span
                              className="notification-unread-dot"
                              title="Unread"
                            />
                          )}
                        </div>
                      </div>

                      <h3 className="notification-title">
                        {item.title}
                      </h3>

                      {/* Message Content with Rejection Reason highlighting */}
                      <div className="notification-msg">
                        {String(item.message || '').split('\n').map((line, idx) => {
                          if (line.startsWith('Rejection Reason:')) {
                            return (
                              <div key={idx} className="notification-rejection-box">
                                {line}
                              </div>
                            );
                          }
                          return (
                            <p
                              key={idx}
                              style={{
                                margin: idx === 0 ? '0' : '3px 0 0 0',
                                color: idx === 0 ? '#A9BDD7' : 'rgba(169, 189, 215, 0.85)',
                                fontSize: idx === 0 ? '12px' : '11px'
                              }}
                            >
                              {line}
                            </p>
                          );
                        })}
                      </div>

                      {/* Footer Actions / Navigation Link */}
                      <div className="notification-action-row">
                        {(item.category === 'digital_land' || notifType.includes('LAND_ORDER') || item.title?.toLowerCase().includes('land')) ? (
                          <span className="notification-inspect-link">
                            Inspect Order in Activity Log &rarr;
                          </span>
                        ) : (
                          <span />
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="notification-mark-read-btn"
                            title="Mark this notification as read"
                          >
                            <CheckIcon size={12} />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="notification-panel-footer">
            <span>ApnaPay Notification Center</span>
            <span>Real-time alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
