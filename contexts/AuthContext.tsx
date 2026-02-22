"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback } from
"react";
import {
  api,
  API_BASE_URL,
  authTokenStore,
  AuthTokens,
  ensureAccessToken } from
"@/lib/apiClient";

interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id?: string | null;
  user_type?: "b2b" | "b2c" | "admin";
  avatar_url?: string | null;
}

type GoogleAuthIntent = "signin" | "signup";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
  email: string,
  password: string,
  fullName: string,
  userType?: "b2b" | "b2c",
  options?: SignUpOptions)
  => Promise<{error: Error | null;needsConfirmation?: boolean;}>;
  signIn: (
  email: string,
  password: string,
  userType?: "b2b" | "b2c")
  => Promise<{error: Error | null;}>;
  signInWithGoogle: (
  userType?: "b2b" | "b2c",
  intent?: GoogleAuthIntent)
  => Promise<{error: Error | null;}>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface BackendUser {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface BackendProfile {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  email?: string;
  company_id?: string | null;
}

interface BackendCompany {
  id: string;
}

interface SignUpOptions {
  companyName?: string;
  businessType?: "shop_online" | "brand" | "factory";
  targetMarkets?: string[];
  phone?: string;
}

interface SignUpPayload {
  user?: BackendUser;
  profile?: BackendProfile | null;
  role?: "b2b" | "b2c" | "admin";
  company?: BackendCompany | null;
  requires_email_verification?: boolean;
  needsConfirmation?: boolean;
  tokens?: AuthTokens;
}

interface SignInPayload {
  user: BackendUser;
  profile?: BackendProfile | null;
  roles?: Array<"b2b" | "b2c" | "admin">;
  company?: BackendCompany | null;
  tokens?: AuthTokens;
}

interface AccountPayload {
  profile?: BackendProfile | null;
  company?: BackendCompany | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "weavecarbon_user";
const GOOGLE_OAUTH_INFLIGHT_KEY = "google_oauth_inflight";
const TOKEN_STORAGE_KEYS = [
"weavecarbon_access_token",
"weavecarbon_refresh_token",
"token",
"access_token",
"refresh_token"];

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "1";
const ACCOUNT_ENDPOINT_ENABLED =
process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT !== "0";

const loadStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as User : null;
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

const normalizeRole = (
role?: string | null)
: User["user_type"] | undefined => {
  if (role === "b2b" || role === "b2c" || role === "admin") {
    return role;
  }
  return undefined;
};

const buildUserFromSignIn = (payload: SignInPayload): User => {
  const role = normalizeRole(payload.roles?.[0]);
  return {
    id: payload.user.id,
    email: payload.user.email,
    full_name: payload.user.full_name || payload.profile?.full_name || undefined,
    company_id: payload.company?.id || payload.profile?.company_id || null,
    user_type: role,
    avatar_url: payload.user.avatar_url || null
  };
};

const buildUserFromSignUp = (
payload: SignUpPayload,
fallbackRole: "b2b" | "b2c")
: User | null => {
  if (!payload.user) return null;
  return {
    id: payload.user.id,
    email: payload.user.email,
    full_name: payload.user.full_name || payload.profile?.full_name || undefined,
    company_id: payload.company?.id || payload.profile?.company_id || null,
    user_type: normalizeRole(payload.role) || fallbackRole,
    avatar_url: payload.user.avatar_url || null
  };
};

const buildUserFromAccount = (
payload: AccountPayload,
fallbackUser: User | null)
: User | null => {
  const profile = payload.profile;
  if (!profile && !fallbackUser) return null;

  const nextId = profile?.user_id || fallbackUser?.id;
  const nextEmail = profile?.email || fallbackUser?.email;

  if (!nextId || !nextEmail) {
    return fallbackUser;
  }

  return {
    id: nextId,
    email: nextEmail,
    full_name: profile?.full_name || fallbackUser?.full_name,
    company_id:
    payload.company?.id || profile?.company_id || fallbackUser?.company_id || null,
    user_type: fallbackUser?.user_type,
    avatar_url: fallbackUser?.avatar_url || null
  };
};

const postWithFallback = async <T,>(
paths: string[],
body?: unknown)
: Promise<T> => {
  let lastError: Error | null = null;

  for (const path of paths) {
    try {
      return await api.post<T>(path, body);
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const isNotFound =
        message.includes("not found") || message.includes("route");
        if (!isNotFound) {
          throw error;
        }
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("No matching endpoint found.");
};

const isNotFoundError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("not found") || message.includes("route");
};

const isUnauthorizedError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("unauthorized") || message.includes("invalid token");
};

const getAccountSafely = async (): Promise<AccountPayload | null> => {
  if (!ACCOUNT_ENDPOINT_ENABLED) {
    return null;
  }

  const accessToken = await ensureAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    return await api.get<AccountPayload>("/account");
  } catch (error) {
    if (isNotFoundError(error) || isUnauthorizedError(error)) {
      return null;
    }
    throw error;
  }
};

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      const stored = loadStoredUser();

      if (AUTH_DISABLED) {
        if (!cancelled) {
          setUser(stored);
          setLoading(false);
        }
        return;
      }

      const hasAuthToken = Boolean(
        authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
      );

      if (!hasAuthToken && stored) {
        persistUser(null);
      }

      if (!cancelled) {
        setUser(hasAuthToken ? stored : null);
      }

      try {
        const account = await getAccountSafely();
        if (account) {
          const nextUser = buildUserFromAccount(account, stored);
          persistUser(nextUser);
          if (!cancelled) {
            setUser(nextUser);
          }
        }
      } catch {

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

  useEffect(() => {
    if (typeof window === "undefined" || AUTH_DISABLED) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      const watchedKeyChanged =
      event.key === null ||
      event.key === STORAGE_KEY ||
      TOKEN_STORAGE_KEYS.includes(event.key);
      if (!watchedKeyChanged) {
        return;
      }

      const hasAuthToken = Boolean(
        authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
      );
      if (!hasAuthToken) {
        persistUser(null);
        setUser(null);
        return;
      }

      setUser(loadStoredUser());
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
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
      const account = await getAccountSafely();
      if (account) {
        const nextUser = buildUserFromAccount(account, user);
        persistUser(nextUser);
        setUser(nextUser);
      } else {
        const hasAuthToken = Boolean(
          authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
        );
        if (!hasAuthToken) {
          persistUser(null);
        }
        const stored = hasAuthToken ? loadStoredUser() : null;
        setUser(stored);
      }
    } catch {
      const hasAuthToken = Boolean(
        authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
      );
      if (!hasAuthToken) {
        persistUser(null);
      }
      const stored = hasAuthToken ? loadStoredUser() : null;
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const signUp = async (
  email: string,
  password: string,
  fullName: string,
  userType?: "b2b" | "b2c",
  options?: SignUpOptions)
  : Promise<{
    error: Error | null;
    needsConfirmation?: boolean;
  }> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    const role = userType ?? "b2b";
    const payloadBody: Record<string, unknown> = {
      email,
      password,
      full_name: fullName,
      role
    };

    if (role === "b2b") {
      const companyName = options?.companyName?.trim();
      const businessType = options?.businessType;
      if (!companyName) {
        return {
          error: new Error("Company name is required for business accounts.")
        };
      }
      if (!businessType) {
        return {
          error: new Error("Business type is required for business accounts.")
        };
      }
      payloadBody.company_name = companyName;
      payloadBody.business_type = businessType;
      payloadBody.target_markets = options?.targetMarkets || [];
    }

    if (options?.phone?.trim()) {
      payloadBody.phone = options.phone.trim();
    }

    try {
      const payload = await postWithFallback<SignUpPayload>(
        ["/auth/signup", "/auth/sign-up"],
        payloadBody
      );
      const needsConfirmation =
      payload?.requires_email_verification ?? payload?.needsConfirmation ?? false;
      const hasAccessToken = Boolean(payload?.tokens?.access_token);

      if (hasAccessToken && payload?.tokens) {
        authTokenStore.setTokens(payload.tokens);
      }

      const nextUser = buildUserFromSignUp(payload, role);
      if (nextUser && hasAccessToken && !needsConfirmation) {
        persistUser(nextUser);
        setUser(nextUser);
      }

      return {
        error: null,
        needsConfirmation
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Sign up failed.")
      };
    }
  };

  const signIn = async (
  email: string,
  password: string,
  userType?: "b2b" | "b2c")
  : Promise<{error: Error | null;}> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    try {
      const payload = await postWithFallback<SignInPayload>(
        ["/auth/signin", "/auth/sign-in", "/auth/login"],
        {
          email,
          password,
          remember_me: true
        }
      );

      const signedInUser = buildUserFromSignIn(payload);
      const nextUser = {
        ...signedInUser,
        user_type: signedInUser.user_type || userType
      };

      if (userType && nextUser.user_type && nextUser.user_type !== userType) {
        authTokenStore.clear();
        return {
          error: new Error(
            `This account is ${nextUser.user_type.toUpperCase()}, not ${userType.toUpperCase()}.`
          )
        };
      }

      authTokenStore.setTokens(payload.tokens);
      persistUser(nextUser);
      setUser(nextUser);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Sign in failed.")
      };
    }
  };

  const signInWithGoogle = async (
  userType?: "b2b" | "b2c",
  intent: GoogleAuthIntent = "signin")
  : Promise<{error: Error | null;}> => {
    if (AUTH_DISABLED) {
      return { error: new Error("Authentication is disabled.") };
    }

    try {
      if (typeof window === "undefined") {
        return { error: new Error("Google sign-in is only available in browser.") };
      }

      const existingInflight = sessionStorage.getItem(GOOGLE_OAUTH_INFLIGHT_KEY);
      if (existingInflight === "1") {
        return { error: new Error("Google authentication is already in progress.") };
      }

      sessionStorage.setItem(GOOGLE_OAUTH_INFLIGHT_KEY, "1");
      const role = userType ?? "b2b";
      if (intent === "signup") {
        window.location.assign(`${API_BASE_URL}/auth/google?intent=signup`);
      } else {
        window.location.assign(
          `${API_BASE_URL}/auth/google?intent=signin&role=${encodeURIComponent(
            role
          )}`
        );
      }

      return { error: null };
    } catch (error) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(GOOGLE_OAUTH_INFLIGHT_KEY);
      }
      return {
        error:
        error instanceof Error ? error : new Error("Google sign-in failed.")
      };
    }
  };

  const signOut = async () => {
    if (!AUTH_DISABLED) {
      try {
        await postWithFallback(
          ["/auth/signout", "/auth/sign-out"],
          { all_devices: false }
        );
      } catch {

      }
    }
    authTokenStore.clear();
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
        updateUser
      }}>

      {children}
    </AuthContext.Provider>);

};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};