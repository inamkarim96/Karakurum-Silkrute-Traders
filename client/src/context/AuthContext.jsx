import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and validate token on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (token && storedUser) {
        try {
          // Validate token by fetching profile
          const response = await authApi.getProfile();
          if (response.success && response.data.user) {
            const sessionUser = response.data.user;
            localStorage.setItem('auth_user', JSON.stringify(sessionUser));
            setUser(sessionUser);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        } catch (err) {
          // Token invalid or expired, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Idle Timeout (Auto Logout for Admins)
  React.useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let timeoutId;
    const IDLE_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Auto logout due to inactivity
        logout();
      }, IDLE_TIME);
    };

    // Listeners for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    // Initial start
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const sessionUser = response.data.user;
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success) {
        const nextUser = { ...user, ...response.data };
        localStorage.setItem('auth_user', JSON.stringify(nextUser));
        setUser(nextUser);
        return response;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register: authApi.register, logout, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

