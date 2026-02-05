/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { type Locale, defaultLocale, locales } from "@/lib/i18n/config";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Read locale from cookie on mount
  useEffect(() => {
    setMounted(true);
    const savedLocale = getCookie("locale") as Locale | undefined;

    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // Set default locale cookie if not exists
      setCookie("locale", defaultLocale);
    }
  }, []);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!locales.includes(newLocale)) return;

      setIsLoading(true);

      // Set cookie
      setCookie("locale", newLocale);

      setLocaleState(newLocale);

      // Refresh the page to load new translations
      router.refresh();

      // Small delay to show loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    },
    [router],
  );

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{ locale: defaultLocale, setLocale: () => {}, isLoading: true }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
