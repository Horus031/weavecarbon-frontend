"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "@/lib/apiClient";

interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id?: string | null;
  user_type?: "b2b" | "b2c" | "admin";
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (
    email: string,
    password: string,
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "weavecarbon_user";
const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "1";

const loadStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const persistUser = (user: User | null) => {
  if (typeof window === "undefined") return;

  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      const stored = loadStoredUser();
      if (!cancelled) {
        setUser(stored);
      }

      if (AUTH_DISABLED || !stored) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const session = await api.get<{ user: User }>("/auth/me");
        if (session?.user) {
          persistUser(session.user);
          if (!cancelled) {
            setUser(session.user);
          }
        }
      } catch {
        // Keep the persisted user as fallback when backend is unreachable.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      persistUser(next);
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (AUTH_DISABLED) {
      const stored = loadStoredUser();
      setUser(stored);
      setLoading(false);
      return;
    }

    try {
      const session = await api.get<{ user: User }>("/auth/me");
      const nextUser = session?.user ?? null;
      persistUser(nextUser);
      setUser(nextUser);
    } catch {
      const stored = loadStoredUser();
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userType?: "b2b" | "b2c",
  ): Promise<{
    error: Error | null;
    needsConfirmation?: boolean;
  }> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    try {
      const payload = await api.post<{ user?: User; needsConfirmation?: boolean }>(
        "/auth/sign-up",
        {
          email,
          password,
          full_name: fullName,
          user_type: userType ?? "b2b",
        },
      );

      if (payload?.user) {
        persistUser(payload.user);
        setUser(payload.user);
      }

      return {
        error: null,
        needsConfirmation: payload?.needsConfirmation ?? false,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Sign up failed."),
      };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    userType?: "b2b" | "b2c",
  ): Promise<{ error: Error | null }> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    try {
      const payload = await api.post<{ user: User }>("/auth/sign-in", {
        email,
        password,
        user_type: userType ?? "b2b",
      });
      persistUser(payload.user);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Sign in failed."),
      };
    }
  };

  const signInWithGoogle = async (
    userType?: "b2b" | "b2c",
  ): Promise<{ error: Error | null }> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    try {
      const payload = await api.post<{ redirectUrl?: string }>(
        "/auth/google",
        {
          user_type: userType ?? "b2b",
        },
      );

      if (payload?.redirectUrl && typeof window !== "undefined") {
        window.location.href = payload.redirectUrl;
        return { error: null };
      }

      return {
        error: new Error("Google sign-in redirect URL is missing."),
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error : new Error("Google sign-in failed."),
      };
    }
  };

  const signOut = async () => {
    if (!AUTH_DISABLED) {
      try {
        await api.post("/auth/sign-out");
      } catch {
        // Still clear local session to avoid stale UI state.
      }
    }
    persistUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
