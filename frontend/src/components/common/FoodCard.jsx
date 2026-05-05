import React from 'react';
import { Link } from 'react-router-dom';
import { IMAGE_BASE_URL } from '../../services/api';
import Badge from './Badge';
import './FoodCard.css';

const FoodCard = ({ food, showActions = false, onEdit, onDelete }) => {
  const isExpired = new Date(food.expiry_date) < new Date();
  const isFree = food.price === 0;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`food-card ${isExpired ? 'expired' : ''}`}>
      <div className="food-card-image">
        {food.image_path ? (
          <img 
            src={`${IMAGE_BASE_URL}/${food.image_path}`} 
            alt={food.title}
            loading="lazy"
          />
        ) : (
          <div className="food-card-placeholder">
            <span>🍽️</span>
          </div>
        )}
        
        <div className="food-card-badges">
          <Badge 
            variant={food.food_type === 'packaged' ? 'info' : 'accent'}
            size="sm"
          >
            {food.food_type === 'packaged' ? '📦 Packaged' : '🥗 Fresh'}
          </Badge>
          
          {isFree && (
            <Badge variant="solid-success" size="sm">
              Free
            </Badge>
          )}
        </div>
        
        {isExpired && (
          <div className="food-card-expired-overlay">
            <span>Expired</span>
          </div>
        )}
      </div>
      
      <div className="food-card-content">
        <h3 className="food-card-title">{food.title}</h3>
        
        {food.description && (
          <p className="food-card-description">
            {food.description.length > 80 
              ? `${food.description.substring(0, 80)}...` 
              : food.description
            }
          </p>
        )}
        
        <div className="food-card-meta">
          <div className="food-card-meta-item">
            <span className="meta-icon">📦</span>
            <span className="meta-text">{food.quantity} available</span>
          </div>
          <div className="food-card-meta-item">
            <span className="meta-icon">📅</span>
            <span className="meta-text">Exp: {formatDate(food.expiry_date)}</span>
          </div>
        </div>
        
        <div className="food-card-footer">
          <div className="food-card-price">
            {isFree ? (
              <span className="price-free">Free</span>
            ) : (
              <>
                <span className="price-value">₹{food.price}</span>
                <span className="price-unit">/ item</span>
              </>
            )}
          </div>
          
          {showActions ? (
            <div className="food-card-actions">
              <button 
                className="food-card-btn edit"
                onClick={() => onEdit && onEdit(food)}
              >
                Edit
              </button>
              <button 
                className="food-card-btn delete"
                onClick={() => onDelete && onDelete(food.id)}
              >
                Delete
              </button>
            </div>
          ) : (
            <Link to={`/food/${food.id}`} className="food-card-view-btn">
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
