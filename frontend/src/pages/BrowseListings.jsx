import React, { useState, useEffect } from 'react';
import { foodApi } from '../services/api';
import { FoodCard, PageLoader, EmptyState, Button } from '../components/common';
import './BrowseListings.css';

const BrowseListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    food_type: '',
    min_price: '',
    max_price: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async (params = {}) => {
    setLoading(true);
    try {
      const cleanParams = {
        keyword: params.keyword || searchParams.keyword || undefined,
        food_type: params.food_type || searchParams.food_type || undefined,
        min_price: (params.min_price || searchParams.min_price) ? parseFloat(params.min_price || searchParams.min_price) : undefined,
        max_price: (params.max_price || searchParams.max_price) ? parseFloat(params.max_price || searchParams.max_price) : undefined,
        limit: 20
      };
      
      // Remove undefined values
      Object.keys(cleanParams).forEach(key => {
        if (cleanParams[key] === undefined || cleanParams[key] === '') {
          delete cleanParams[key];
        }
      });
      
      const data = await foodApi.search(cleanParams);
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(searchParams);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newParams = { ...searchParams, [name]: value };
    setSearchParams(newParams);
    
    // Auto-apply filters when changed (except for keyword which requires search button)
    if (name !== 'keyword') {
      fetchListings(newParams);
    }
  };

  const clearFilters = () => {
    setSearchParams({
      keyword: '',
      food_type: '',
      min_price: '',
      max_price: '',
    });
    fetchListings({
      keyword: '',
      food_type: '',
      min_price: '',
      max_price: '',
    });
  };

  const activeFiltersCount = [
    searchParams.food_type,
    searchParams.min_price,
    searchParams.max_price,
  ].filter(Boolean).length;

  return (
    <div className="browse-page">
      {/* Header */}
      <div className="browse-header">
        <div className="header-content">
          <h1>🍽️ Browse Food</h1>
          <p>Discover available food donations near you</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              name="keyword"
              placeholder="Search for food..."
              value={searchParams.keyword}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
          
          <Button type="submit" variant="primary">
            Search
          </Button>
          
          <button 
            type="button" 
            className={`filter-toggle ${filtersOpen ? 'active' : ''}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <span>⚙️</span>
            Filters
            {activeFiltersCount > 0 && (
              <span className="filter-count">{activeFiltersCount}</span>
            )}
          </button>
        </form>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Food Type</label>
              <select
                name="food_type"
                value={searchParams.food_type}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="packaged">📦 Packaged</option>
                <option value="non-packaged">🥗 Fresh/Non-Packaged</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  name="min_price"
                  placeholder="Min ₹"
                  value={searchParams.min_price}
                  onChange={handleFilterChange}
                  className="price-input"
                  min="0"
                />
                <span>to</span>
                <input
                  type="number"
                  name="max_price"
                  placeholder="Max ₹"
                  value={searchParams.max_price}
                  onChange={handleFilterChange}
                  className="price-input"
                  min="0"
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="results-section">
        {loading ? (
          <PageLoader />
        ) : listings.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No food items found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <>
            <div className="results-header">
              <p className="results-count">
                Found <strong>{listings.length}</strong> items
              </p>
            </div>
            
            <div className="listings-grid">
              {listings.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseListings;
