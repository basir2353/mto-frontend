import { api, apiPublic } from "./client";
import type { AuthTokens, User, UserRole } from "./types";

export type RegisterInput = {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessName?: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
  verificationToken?: string;
};

export const authApi = {
  register: (input: RegisterInput) =>
    apiPublic<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) }),

  login: (email: string, password: string) =>
    apiPublic<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => api<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => api<User | null>("/auth/me"),

  verifyEmail: (token: string) =>
    apiPublic<{ message: string; user: User }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    apiPublic<{ message: string; resetToken?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiPublic<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};
