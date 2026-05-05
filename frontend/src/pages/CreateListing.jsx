import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodApi } from '../services/api';
import { Button, Input, Card } from '../components/common';
import './CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    food_type: 'packaged',
    quantity: 1,
    price: 0,
    expiry_date: '',
    image: null,
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.title || formData.title.length < 2) {
      errors.title = 'Title must be at least 2 characters';
    }
    
    if (formData.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }
    
    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }
    
    if (!formData.expiry_date) {
      errors.expiry_date = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < new Date()) {
        errors.expiry_date = 'Expiry date must be in the future';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('food_type', formData.food_type);
      submitData.append('quantity', formData.quantity.toString());
      submitData.append('price', formData.price.toString());
      submitData.append('expiry_date', formData.expiry_date);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await foodApi.create(submitData);
      navigate('/my-listings');
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="create-listing-page">
      <div className="page-header">
        <h1>Create Food Listing</h1>
        <p>Share your food with someone in need</p>
      </div>

      <Card variant="default" padding="lg" className="listing-form-card">
        {error && (
          <div className="form-error-banner">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Image Upload */}
          <div className="image-upload-section">
            <label className="upload-label">Food Image</label>
            
            <div 
              className={`image-upload-area ${imagePreview ? 'has-image' : ''}`}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p>Click to upload image</p>
                  <span className="upload-hint">JPG, PNG, GIF up to 10MB</span>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                hidden
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <Input
              label="Title"
              name="title"
              placeholder="e.g., Fresh Vegetables, Homemade Biryani"
              value={formData.title}
              onChange={handleChange}
              error={formErrors.title}
              required
            />

            <div className="input-container">
              <label className="input-label">Description</label>
              <textarea
                name="description"
                className="input-field"
                placeholder="Describe your food item (ingredients, preparation, etc.)"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          {/* Food Details */}
          <div className="form-section">
            <h3>Food Details</h3>
            
            <div className="form-grid">
              <div className="input-container">
                <label className="input-label">Food Type</label>
                <select
                  name="food_type"
                  className="input-field"
                  value={formData.food_type}
                  onChange={handleChange}
                >
                  <option value="packaged">📦 Packaged Food</option>
                  <option value="non-packaged">🥗 Fresh/Non-Packaged</option>
                </select>
              </div>

              <Input
                label="Quantity"
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                error={formErrors.quantity}
                required
              />
            </div>

            <div className="form-grid">
              <div className="input-container">
                <label className="input-label">
                  Price (₹)
                  <span className="label-hint">Set to 0 for free</span>
                </label>
                <input
                  type="number"
                  name="price"
                  className="input-field"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                />
                {formData.price === 0 && (
                  <span className="free-badge">Free Item 🎉</span>
                )}
              </div>

              <Input
                label="Expiry Date"
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                error={formErrors.expiry_date}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create Listing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateListing;
