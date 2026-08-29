import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("kereview_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      localStorage.removeItem("kereview_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("kereview_token", token);
    setUser(user);
    return user;
  };

  const signup = async (name, email, password) => {
    const { token, user } = await api.signup({ name, email, password });
    localStorage.setItem("kereview_token", token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("kereview_token");
    setUser(null);
  };

  const updateUser = (patch) => setUser((u) => (u ? { ...u, ...patch } : u));

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
