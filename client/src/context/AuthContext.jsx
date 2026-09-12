import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Read stored user synchronously so the first render already has auth state
const getStoredUser = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const stored = localStorage.getItem('auth_user');
    if (token && stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser); // synchronous init – no flash
  const [loading, setLoading] = useState(false);   // never blocks rendering

  // Background token validation – runs AFTER render, never blocks the UI
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // no token, nothing to validate

    const validateToken = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.success && response.data.user) {
          // Refresh stored user with latest data from server
          const sessionUser = response.data.user;
          localStorage.setItem('auth_user', JSON.stringify(sessionUser));
          setUser(sessionUser);
        }
        // If response.success is false but no error thrown, keep existing user
      } catch (err) {
        // Only log out on explicit 401 / 403 (token truly invalid/expired)
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
        }
        // Network errors, 500s, timeouts → keep user logged in
      }
    };

    validateToken();
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
      {children}
    </AuthContext.Provider>
  );
};

