import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersApi, IMAGE_BASE_URL } from '../services/api';
import { Card, Badge, Button, PageLoader, EmptyState } from '../components/common';
import './Orders.css';

const Orders = () => {
  const { isDoner } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? null : filter;
      const data = await ordersApi.getAll(status, 1, 50);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status }
          : order
      ));
    } catch (err) {
      alert(err.message || 'Failed to update order');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { variant: 'warning', icon: '⏳' },
      accepted: { variant: 'success', icon: '✅' },
      rejected: { variant: 'error', icon: '❌' }
    };
    const { variant, icon } = config[status];
    return (
      <Badge variant={variant} size="md">
        {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="header-content">
          <h1>{isDoner ? '📦 Order Requests' : '📦 My Orders'}</h1>
          <p>
            {isDoner 
              ? 'Manage food requests from receivers' 
              : 'Track your food requests'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'pending', 'accepted', 'rejected'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? '📋 All' : 
             status === 'pending' ? '⏳ Pending' :
             status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <PageLoader />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders found"
          description={
            filter === 'all' 
              ? (isDoner 
                  ? "You haven't received any orders yet" 
                  : "You haven't placed any orders yet")
              : `No ${filter} orders found`
          }
          actionLabel={isDoner ? "View Listings" : "Browse Food"}
          onAction={() => window.location.href = isDoner ? '/my-listings' : '/browse'}
        />
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <Card key={order.id} variant="default" padding="none" className="order-card">
              <div className="order-content">
                {/* Food Image */}
                <div className="order-image">
                  {order.food_item?.image_path ? (
                    <img 
                      src={`${IMAGE_BASE_URL}/${order.food_item.image_path}`}
                      alt={order.food_item?.title}
                    />
                  ) : (
                    <div className="image-placeholder">🍽️</div>
                  )}
                </div>

                {/* Order Info */}
                <div className="order-info">
                  <div className="order-header">
                    <Link to={`/food/${order.food_item_id}`} className="order-title">
                      {order.food_item?.title}
                    </Link>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="order-meta">
                    <span className="meta-item">
                      <strong>Qty:</strong> {order.quantity}
                    </span>
                    <span className="meta-item">
                      <strong>Total:</strong> {order.total_price === 0 ? 'Free' : `₹${order.total_price}`}
                    </span>
                    <span className="meta-item">
                      <strong>Date:</strong> {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className="order-parties">
                    {isDoner ? (
                      <span>
                        <strong>From:</strong> {order.receiver?.full_name}
                        {order.receiver?.phone && ` • ${order.receiver.phone}`}
                      </span>
                    ) : (
                      <span>
                        <strong>Doner:</strong> {order.doner?.full_name}
                        {order.doner?.phone && ` • ${order.doner.phone}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="order-actions">
                  {isDoner && order.status === 'pending' ? (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'accepted')}
                        loading={actionLoading === order.id}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'rejected')}
                        loading={actionLoading === order.id}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Link to={`/chat?order=${order.id}`}>
                      <Button variant="secondary" size="sm">
                        💬 Chat
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
