import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { foodApi } from '../services/api';
import { FoodCard, PageLoader, EmptyState, Button } from '../components/common';
import './MyListings.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await foodApi.getMyListings(1, 50);
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    
    try {
      await foodApi.delete(id);
      setListings(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="my-listings-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>My Listings</h1>
          <p>Manage your food donations</p>
        </div>
        
        <Link to="/create-listing">
          <Button variant="primary" icon={<span>➕</span>}>
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="listings-summary">
        <div className="summary-item">
          <span className="summary-value">{listings.length}</span>
          <span className="summary-label">Total Listings</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {listings.filter(l => l.is_available && new Date(l.expiry_date) > new Date()).length}
          </span>
          <span className="summary-label">Active</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {listings.filter(l => new Date(l.expiry_date) < new Date()).length}
          </span>
          <span className="summary-label">Expired</span>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <EmptyState
          icon="🍱"
          title="No listings yet"
          description="Start sharing food by creating your first listing."
          actionLabel="Create Listing"
          onAction={() => window.location.href = '/create-listing'}
        />
      ) : (
        <div className="listings-grid">
          {listings.map(food => (
            <FoodCard
              key={food.id}
              food={food}
              showActions
              onEdit={(food) => window.location.href = `/edit-listing/${food.id}`}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
