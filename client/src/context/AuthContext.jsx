import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pfm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pfm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('pfm_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('pfm_token');
        localStorage.removeItem('pfm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (userData, token) => {
    localStorage.setItem('pfm_token', token);
    localStorage.setItem('pfm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      persistSession(res.data.user, res.data.token);
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const res = await authService.register(payload);
      persistSession(res.data.user, res.data.token);
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pfm_token');
    localStorage.removeItem('pfm_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('pfm_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
