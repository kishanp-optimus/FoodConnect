import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getToken, 
  setToken, 
  removeToken, 
  getUser, 
  setUser, 
  removeUser,
  authApi 
} from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      const savedUser = getUser();
      
      if (token && savedUser) {
        try {
          const userData = await authApi.getMe();
          setUserState(userData);
          setUser(userData);
        } catch (err) {
          // Token is invalid, clear it
          removeToken();
          removeUser();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login({ email, password });
      setToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      return response.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      setToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      return response.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isDoner: user?.role === 'doner',
    isReceiver: user?.role === 'receiver',
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
