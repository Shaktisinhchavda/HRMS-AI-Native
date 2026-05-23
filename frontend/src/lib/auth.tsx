"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api, User, Token } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Fetch current user profile using stored token
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.get<User>("/api/auth/me");
      setUser(userData);
    } catch {
      // Token is invalid or expired
      localStorage.removeItem("hrms_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const tokenData = await api.post<Token>("/api/auth/login", { email, password });
      localStorage.setItem("hrms_token", tokenData.access_token);
      await fetchUser();
    } catch (err: unknown) {
      const apiError = err as { detail?: string };
      const message = apiError?.detail || "Login failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hrms_token");
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
