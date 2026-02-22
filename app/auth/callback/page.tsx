"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, authTokenStore, isUnauthorizedApiError } from "@/lib/apiClient";

const GOOGLE_OAUTH_INFLIGHT_KEY = "google_oauth_inflight";

type CompanyCheckPayload = {
  is_b2b?: boolean;
  has_company?: boolean;
  user_type?: "b2b" | "b2c" | "admin";
  data?: {
    is_b2b?: boolean;
    has_company?: boolean;
    user_type?: "b2b" | "b2c" | "admin";
  };
};

type StoredUser = {
  user_type?: "b2b" | "b2c" | "admin";
  company_id?: string | null;
};

const normalizeCompanyCheck = (payload: CompanyCheckPayload | null) => {
  const nested = payload?.data;
  const source = nested || payload || {};
  const isB2b =
  typeof source.is_b2b === "boolean" ?
  source.is_b2b :
  source.user_type === "b2b";
  const hasCompany =
  typeof source.has_company === "boolean" ? source.has_company : false;
  return { isB2b, hasCompany };
};

const getFallbackRedirectFromStoredUser = () => {
  if (typeof window === "undefined") return "/overview";
  try {
    const raw = localStorage.getItem("weavecarbon_user");
    if (!raw) return "/overview";
    const user = JSON.parse(raw) as StoredUser;
    if (user.user_type === "b2c") return "/b2c";
    if (user.user_type === "b2b" && !user.company_id) {
      return "/onboarding?source=google";
    }
    return "/overview";
  } catch {
    return "/overview";
  }
};

const clearOAuthInflightFlag = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GOOGLE_OAUTH_INFLIGHT_KEY);
};

const clearCallbackHash = () => {
  if (typeof window === "undefined") return;
  if (!window.location.hash && !window.location.search) return;
  window.history.replaceState({}, document.title, window.location.pathname);
};

const mapGoogleErrorMessage = (errorCode: string, fallback?: string) => {
  switch (errorCode) {
    case "GOOGLE_ACCOUNT_NOT_FOUND":
      return "Google account not found. Please try Google sign-up.";
    case "GOOGLE_EMAIL_ALREADY_REGISTERED":
      return "Email already exists. Please use Google sign-in.";
    case "INVALID_OAUTH_STATE":
      return "OAuth state is invalid or expired. Please try again.";
    case "GOOGLE_TOKEN_EXCHANGE_FAILED":
    case "GOOGLE_USERINFO_FAILED":
    case "GOOGLE_AUTH_FAILED":
      return "Google authentication is temporarily unavailable. Please retry manually.";
    case "MISSING_CODE":
      return "Invalid Google callback. Please sign in again.";
    default:
      return fallback || errorCode;
  }
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) return;
    hasHandledCallback.current = true;

    let cancelled = false;

    const resolvePostLoginPath = async () => {
      try {
        const payload = await api.get<CompanyCheckPayload>("/auth/check-company");
        const { isB2b, hasCompany } = normalizeCompanyCheck(payload);
        if (isB2b && !hasCompany) return "/onboarding?source=google";
        if (!isB2b) return "/b2c";
        return "/overview";
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          authTokenStore.clear();
          return "/auth?error=UNAUTHORIZED";
        }
        return getFallbackRedirectFromStoredUser();
      }
    };

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const query = url.searchParams;
        const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");

        const errorCode = query.get("error") || hash.get("error");
        const errorDescription =
        query.get("error_description") || hash.get("error_description");

        if (errorCode) {
          clearOAuthInflightFlag();
          clearCallbackHash();
          const mappedMessage = mapGoogleErrorMessage(errorCode, errorDescription || undefined);
          if (!cancelled) {
            setErrorMessage(mappedMessage);
          }
          const nextParams = new URLSearchParams();
          nextParams.set("error", errorCode);
          if (errorDescription) {
            nextParams.set("error_description", errorDescription);
          }
          router.replace(`/auth?${nextParams.toString()}`);
          return;
        }

        const accessToken = hash.get("access_token") || query.get("access_token");
        const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
        const requiresCompanySetup =
        (hash.get("requires_company_setup") || query.get("requires_company_setup")) === "1";
        const nextStep = hash.get("next_step") || query.get("next_step");

        if (!accessToken || !refreshToken) {
          clearOAuthInflightFlag();
          clearCallbackHash();
          const message = mapGoogleErrorMessage("MISSING_CODE");
          if (!cancelled) {
            setErrorMessage(message);
          }
          router.replace("/auth?error=MISSING_CODE");
          return;
        }

        authTokenStore.setTokens({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        clearOAuthInflightFlag();
        clearCallbackHash();

        await refreshUser();

        if (requiresCompanySetup || nextStep === "company_onboarding") {
          router.replace("/onboarding?source=google");
          return;
        }

        const destination = await resolvePostLoginPath();
        router.replace(destination);
      } catch {
        clearOAuthInflightFlag();
        clearCallbackHash();
        if (!cancelled) {
          setErrorMessage(mapGoogleErrorMessage("GOOGLE_AUTH_FAILED"));
        }
        authTokenStore.clear();
        router.replace("/auth?error=GOOGLE_AUTH_FAILED");
      }
    };

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [refreshUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-lg font-semibold">Processing Google authentication...</h2>
        <p className="text-sm text-muted-foreground">
          {errorMessage ? `Error: ${errorMessage}` : "Please wait a moment."}
        </p>
      </div>
    </div>);

}