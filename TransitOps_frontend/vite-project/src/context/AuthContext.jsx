import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, setToken, setUser, clearToken, authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getUser());
  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      setUser({ name: data.name, email: data.email, role: data.role });
      setTokenState(data.token);
      setUserState({ name: data.name, email: data.email, role: data.role });
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, roleName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(name, email, password, roleName);
      setToken(data.token);
      setUser({ name: data.name, email: data.email, role: data.role });
      setTokenState(data.token);
      setUserState({ name: data.name, email: data.email, role: data.role });
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
