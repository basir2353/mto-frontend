"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type User, type UserRole } from "@/lib/api";
import { clearTokens, hasSession, setTokens } from "@/lib/session";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: Parameters<typeof authApi.register>[0]) => Promise<{ user: User; verificationToken?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!hasSession()) {
      setUser(null);
      return;
    }
    const me = await authApi.me();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (hasSession()) await refreshUser();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const res = await authApi.login(email, password);
    setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: Parameters<typeof authApi.register>[0]) => {
    setError(null);
    const res = await authApi.register(input);
    setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    return { user: res.user, verificationToken: res.verificationToken };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearTokens();
    setUser(null);
    router.push("/app");
  }, [router]);

  const hasRole = useCallback((role: UserRole) => !!user?.roles.includes(role), [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      clearError: () => setError(null),
      hasRole,
    }),
    [user, loading, error, login, register, logout, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
