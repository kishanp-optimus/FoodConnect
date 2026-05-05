import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { foodApi, ordersApi, IMAGE_BASE_URL } from '../services/api';
import { Button, Badge, Card, PageLoader } from '../components/common';
import './FoodDetails.css';

const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isReceiver } = useAuth();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchFoodDetails();
  }, [id]);

  const fetchFoodDetails = async () => {
    try {
      const data = await foodApi.getById(id);
      setFood(data);
    } catch (err) {
      console.error('Failed to fetch food details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isReceiver) {
      alert('Only receivers can place orders');
      return;
    }

    setOrderLoading(true);
    try {
      await ordersApi.create({
        food_item_id: id,
        quantity: quantity,
      });
      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <PageLoader />;

  if (!food) {
    return (
      <div className="food-details-page">
        <div className="not-found">
          <span>🔍</span>
          <h2>Food item not found</h2>
          <p>The item you're looking for doesn't exist or has been removed.</p>
          <Link to="/browse">
            <Button variant="primary">Browse Food</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(food.expiry_date) < new Date();
  const isOwner = food.created_by === user?.id;
  const isFree = food.price === 0;
  const totalPrice = food.price * quantity;

  return (
    <div className="food-details-page">
      {/* Success Overlay */}
      {orderSuccess && (
        <div className="order-success-overlay">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <h2>Order Placed Successfully!</h2>
            <p>Redirecting to your orders...</p>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/browse">Browse</Link>
        <span>/</span>
        <span>{food.title}</span>
      </div>

      <div className="food-details-grid">
        {/* Image Section */}
        <div className="food-image-section">
          <div className="food-image-container">
            {food.image_path ? (
              <img 
                src={`${IMAGE_BASE_URL}/${food.image_path}`} 
                alt={food.title}
              />
            ) : (
              <div className="food-image-placeholder">
                <span>🍽️</span>
              </div>
            )}
            
            <div className="image-badges">
              <Badge 
                variant={food.food_type === 'packaged' ? 'info' : 'accent'}
                size="lg"
              >
                {food.food_type === 'packaged' ? '📦 Packaged' : '🥗 Fresh'}
              </Badge>
              
              {isFree && (
                <Badge variant="solid-success" size="lg">
                  🎉 Free
                </Badge>
              )}
              
              {isExpired && (
                <Badge variant="error" size="lg">
                  Expired
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="food-info-section">
          <h1 className="food-title">{food.title}</h1>
          
          {/* Price */}
          <div className="food-price-section">
            {isFree ? (
              <span className="price-free">Free</span>
            ) : (
              <>
                <span className="price-value">₹{food.price}</span>
                <span className="price-unit">per item</span>
              </>
            )}
          </div>

          {/* Description */}
          {food.description && (
            <div className="food-description">
              <h3>Description</h3>
              <p>{food.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-icon">📦</span>
              <div>
                <span className="detail-label">Available Quantity</span>
                <span className="detail-value">{food.quantity} items</span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <div>
                <span className="detail-label">Expiry Date</span>
                <span className={`detail-value ${isExpired ? 'expired' : ''}`}>
                  {formatDate(food.expiry_date)}
                </span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <div>
                <span className="detail-label">Posted By</span>
                <span className="detail-value">{food.creator?.full_name || 'Anonymous'}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">🕐</span>
              <div>
                <span className="detail-label">Listed On</span>
                <span className="detail-value">{formatDate(food.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Order Section */}
          {isReceiver && !isOwner && !isExpired && food.is_available ? (
            <Card variant="gradient" padding="lg" className="order-card">
              <h3>Place Order</h3>
              
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(food.quantity, q + 1))}
                    disabled={quantity >= food.quantity}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="order-total">
                <span>Total</span>
                <span className="total-value">
                  {isFree ? 'Free' : `₹${totalPrice.toFixed(2)}`}
                </span>
              </div>
              
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleOrder}
                loading={orderLoading}
              >
                Place Order
              </Button>
            </Card>
          ) : isOwner ? (
            <div className="owner-notice">
              <span>ℹ️</span>
              <p>This is your listing. You can manage it from <Link to="/my-listings">My Listings</Link>.</p>
            </div>
          ) : isExpired ? (
            <div className="expired-notice">
              <span>⚠️</span>
              <p>This item has expired and is no longer available for ordering.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FoodDetails;
