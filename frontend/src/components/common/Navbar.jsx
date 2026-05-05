import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isDoner } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifs, countData] = await Promise.all([
          notificationsApi.getAll(false, 1, 5),
          notificationsApi.getUnreadCount()
        ]);
        setNotifications(notifs);
        setUnreadCount(countData.count);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await notificationsApi.markAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifOpen(false);
    if (notif.reference_id) {
      navigate(`/orders`);
    }
  };

  const navLinks = isDoner 
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/my-listings', label: 'My Listings', icon: '🍱' },
        { path: '/create-listing', label: 'Add Listing', icon: '➕' },
        { path: '/orders', label: 'Orders', icon: '📦' },
        { path: '/chat', label: 'Chat', icon: '💬' },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/browse', label: 'Browse Food', icon: '🍽️' },
        { path: '/orders', label: 'My Orders', icon: '📦' },
        { path: '/chat', label: 'Chat', icon: '💬' },
      ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-logo">
            <img src="/logo.png" alt="FoodConnect" />
          </div>
          <div className="brand-text">
            <span className="brand-name">
              <span className="brand-food">Food</span>
              <span className="brand-connect">Connect</span>
            </span>
          </div>
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-link-icon">{link.icon}</span>
                <span className="nav-link-text">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            <div className="notification-wrapper" ref={notifRef}>
              <button 
                className="notification-btn"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        className="mark-all-read"
                        onClick={async () => {
                          await notificationsApi.markAllAsRead();
                          setUnreadCount(0);
                          setNotifications(prev => 
                            prev.map(n => ({ ...n, is_read: 1 }))
                          );
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <span>🔔</span>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notif-icon">
                            {notif.type === 'order' ? '📦' : '💬'}
                          </div>
                          <div className="notif-content">
                            <p className="notif-title">{notif.title}</p>
                            <p className="notif-message">{notif.message}</p>
                            <span className="notif-time">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu">
              <div className="user-avatar">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.full_name}</span>
                <span className="user-role">{isDoner ? 'Doner' : 'Receiver'}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button 
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
