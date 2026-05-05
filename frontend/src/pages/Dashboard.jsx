import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersApi, foodApi } from '../services/api';
import { Card, Badge, PageLoader, EmptyState } from '../components/common';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isDoner } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          ordersApi.getStats(),
          ordersApi.getAll(null, 1, 5)
        ]);
        
        setStats(statsData);
        setRecentOrders(ordersData);
        
        if (isDoner) {
          const listingsData = await foodApi.getMyListings(1, 4);
          setRecentListings(listingsData);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isDoner]);

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'error'
    };
    return <Badge variant={variants[status]} size="sm">{status}</Badge>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p>Here's what's happening with your {isDoner ? 'donations' : 'food requests'} today.</p>
        </div>
        
        {isDoner && (
          <Link to="/create-listing" className="quick-action-btn">
            <span>➕</span>
            Add New Listing
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card variant="elevated" padding="md" className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            📦
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.total_orders || 0}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </Card>
        
        <Card variant="elevated" padding="md" className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            ⏳
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.pending_orders || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
        </Card>
        
        <Card variant="elevated" padding="md" className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            ✅
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.accepted_orders || 0}</span>
            <span className="stat-label">Accepted</span>
          </div>
        </Card>
        
        {isDoner && (
          <Card variant="elevated" padding="md" className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
              🍱
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.active_listings || 0}</span>
              <span className="stat-label">Active Listings</span>
            </div>
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Recent Orders */}
        <Card variant="default" padding="none" className="dashboard-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/orders" className="view-all-link">View All →</Link>
          </div>
          
          <div className="card-content">
            {recentOrders.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No orders yet"
                description={isDoner ? "Orders will appear when receivers request your food" : "Browse food listings to place your first order"}
              />
            ) : (
              <div className="orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <h4>{order.food_item?.title}</h4>
                      <p>
                        {isDoner ? `From: ${order.receiver?.full_name}` : `To: ${order.doner?.full_name}`}
                        <span className="order-qty">• Qty: {order.quantity}</span>
                      </p>
                    </div>
                    <div className="order-meta">
                      {getStatusBadge(order.status)}
                      <span className="order-price">
                        {order.total_price === 0 ? 'Free' : `₹${order.total_price}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions or Recent Listings */}
        {isDoner ? (
          <Card variant="default" padding="none" className="dashboard-card">
            <div className="card-header">
              <h3>My Listings</h3>
              <Link to="/my-listings" className="view-all-link">View All →</Link>
            </div>
            
            <div className="card-content">
              {recentListings.length === 0 ? (
                <EmptyState
                  icon="🍱"
                  title="No listings yet"
                  description="Create your first food listing to start sharing"
                  actionLabel="Create Listing"
                  onAction={() => window.location.href = '/create-listing'}
                />
              ) : (
                <div className="listings-grid">
                  {recentListings.map(listing => (
                    <Link to={`/food/${listing.id}`} key={listing.id} className="mini-listing-card">
                      <div className="listing-preview">
                        {listing.image_path ? (
                          <img 
                            src={`${window.location.protocol}//${window.location.hostname}:8000/images/${listing.image_path}`}
                            alt={listing.title}
                          />
                        ) : (
                          <span>🍽️</span>
                        )}
                      </div>
                      <div className="listing-info">
                        <h5>{listing.title}</h5>
                        <span className="listing-price">
                          {listing.price === 0 ? 'Free' : `₹${listing.price}`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card variant="gradient" padding="lg" className="dashboard-card promo-card">
            <div className="promo-content">
              <h3>🍽️ Find Fresh Food Near You</h3>
              <p>Browse available food donations in your area and help reduce food waste.</p>
              <Link to="/browse" className="promo-btn">
                Browse Food
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Tips Section */}
      <Card variant="outlined" padding="md" className="tips-card">
        <h4>💡 Tips for {isDoner ? 'Doners' : 'Receivers'}</h4>
        <div className="tips-grid">
          {isDoner ? (
            <>
              <div className="tip-item">
                <span>📸</span>
                <p>Add clear photos of your food items</p>
              </div>
              <div className="tip-item">
                <span>📅</span>
                <p>Keep expiry dates accurate</p>
              </div>
              <div className="tip-item">
                <span>💬</span>
                <p>Respond to orders promptly</p>
              </div>
            </>
          ) : (
            <>
              <div className="tip-item">
                <span>🔍</span>
                <p>Use filters to find specific items</p>
              </div>
              <div className="tip-item">
                <span>📍</span>
                <p>Check pickup locations carefully</p>
              </div>
              <div className="tip-item">
                <span>⭐</span>
                <p>Leave reviews for doners</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
