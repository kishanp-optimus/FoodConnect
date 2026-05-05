import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/common';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'receiver',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.full_name || formData.full_name.length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }
    
    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the context
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">
            <img src="/logo.png" alt="FoodConnect" className="auth-logo" />
            <h1>
              <span className="brand-food">Food</span>
              <span className="brand-connect">Connect</span>
            </h1>
            <p className="tagline">Share Food. Connect Hearts.</p>
          </div>
          
          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">🍱</span>
              <div>
                <h4>Share Food</h4>
                <p>Donate excess food to those in need</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <div>
                <h4>Connect People</h4>
                <p>Build a community of givers and receivers</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💚</span>
              <div>
                <h4>Reduce Waste</h4>
                <p>Help minimize food wastage together</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right signup">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Join FoodConnect today</p>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <Input
                  label="Full Name"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  error={formErrors.full_name}
                  required
                />
                
                <Input
                  label="Username"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  error={formErrors.username}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                required
              />

              <div className="form-row">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  required
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                  required
                />
              </div>

              <div className="role-selector">
                <label className="role-label">I want to:</label>
                <div className="role-options">
                  <label className={`role-option ${formData.role === 'receiver' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="receiver"
                      checked={formData.role === 'receiver'}
                      onChange={handleChange}
                    />
                    <div className="role-card">
                      <span className="role-icon">🍽️</span>
                      <span className="role-title">Receive Food</span>
                      <span className="role-desc">Browse and request food</span>
                    </div>
                  </label>
                  
                  <label className={`role-option ${formData.role === 'doner' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="doner"
                      checked={formData.role === 'doner'}
                      onChange={handleChange}
                    />
                    <div className="role-card">
                      <span className="role-icon">🎁</span>
                      <span className="role-title">Donate Food</span>
                      <span className="role-desc">Share food with others</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <Input
                  label="Phone (Optional)"
                  name="phone"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
                
                <Input
                  label="Address (Optional)"
                  name="address"
                  placeholder="Your city"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                Create Account
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
