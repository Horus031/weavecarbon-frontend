"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SocialLogin from "@/components/auth/SocialLogin";
import EmailAuthTabs from "@/components/auth/EmailAuthTabs";
import { useToast } from "@/hooks/useToast";

const REMEMBER_EMAIL_KEY = "weavecarbon_auth_email";
const REMEMBER_ME_KEY = "weavecarbon_auth_remember_me";

const AuthForm: React.FC = () => {
  const t = useTranslations("auth");
  const { signUp, signIn, signInWithGoogle, signOut, user, loading } =
    useAuth();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "1";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const userType = (searchParams.get("type") as "b2b" | "b2c") || "b2b";
  const forceLogin = searchParams.get("forceLogin") === "1";
  const forceSignOutDoneRef = useRef(false);
  const forceLoginCheckedRef = useRef(false);
  const handledAuthErrorRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<
    "" | "shop_online" | "brand" | "factory"
  >("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    companyName?: string;
    businessType?: string;
  }>({});

  const getDashboardPath = useCallback(
    (type: "b2b" | "b2c" | "admin" | undefined) => {
      return type === "b2c" ? "/b2c" : "/overview";
    },
    [],
  );

  const redirectToCheckEmail = useCallback(
    (params: {
      email?: string;
      source?: "email" | "google";
      intent?: "signin" | "signup";
    }) => {
      const nextParams = new URLSearchParams();
      if (params.email?.trim()) {
        nextParams.set("email", params.email.trim());
      }
      if (params.source) {
        nextParams.set("source", params.source);
      }
      if (params.intent) {
        nextParams.set("intent", params.intent);
      }
      const query = nextParams.toString();
      router.push(query ? `/auth/check-email?${query}` : "/auth/check-email");
    },
    [router],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRememberMe = localStorage.getItem(REMEMBER_ME_KEY);
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (storedRememberMe === "0" || storedRememberMe === "1") {
      setRememberMe(storedRememberMe === "1");
    }
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0");
    if (!rememberMe) {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }, [rememberMe]);

  useEffect(() => {
    if (forceLogin) return;
    if (user && !loading) {
      if (user.user_type === "b2b" && !user.company_id) {
        router.push("/onboarding");
      } else {
        router.push(getDashboardPath(user.user_type));
      }
    }
  }, [user, loading, router, getDashboardPath, forceLogin]);

  useEffect(() => {
    if (!forceLogin || loading || forceLoginCheckedRef.current) return;

    forceLoginCheckedRef.current = true;

    if (user && !forceSignOutDoneRef.current) {
      forceSignOutDoneRef.current = true;
      void signOut();
    }
  }, [forceLogin, loading, user, signOut]);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    if (!errorCode) {
      handledAuthErrorRef.current = null;
      return;
    }

    const errorFingerprint = `${errorCode}|${errorDescription || ""}`;
    if (handledAuthErrorRef.current === errorFingerprint) return;
    handledAuthErrorRef.current = errorFingerprint;

    const oauthErrors: Record<string, string> = {
      GOOGLE_ACCOUNT_NOT_FOUND: t("oauthErrors.accountNotFound"),
      GOOGLE_EMAIL_ALREADY_REGISTERED: t("oauthErrors.emailAlreadyRegistered"),
      INVALID_OAUTH_STATE: t("oauthErrors.invalidState"),
      GOOGLE_TOKEN_EXCHANGE_FAILED: t("oauthErrors.googleAuthFailed"),
      GOOGLE_USERINFO_FAILED: t("oauthErrors.googleAuthFailed"),
      GOOGLE_AUTH_FAILED: t("oauthErrors.googleAuthFailed"),
      MISSING_CODE: t("oauthErrors.missingCode"),
      EMAIL_NOT_VERIFIED: t("oauthErrors.emailNotVerified"),
      missing_tokens: t("oauthErrors.missingCode"),
    };

    if (errorCode === "EMAIL_NOT_VERIFIED") {
      redirectToCheckEmail({
        email: errorDescription || email,
        source: "google",
        intent: "signin",
      });
      return;
    }

    const message = oauthErrors[errorCode] || errorDescription || errorCode;

    toast({
      title: t("oauthErrors.title"),
      description: message,
      variant: "destructive",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("error_description");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/auth?${nextQuery}` : "/auth");
  }, [searchParams, toast, router, t, redirectToCheckEmail, email]);

  const validateForm = (isSignUp: boolean) => {
    const emailSchema = z.string().email(t("validation.invalidEmail"));
    const passwordSchema = z
      .string()
      .min(8, t("validation.passwordMin"))
      .regex(/[A-Z]/, t("validation.passwordUppercase"))
      .regex(/[a-z]/, t("validation.passwordLowercase"))
      .regex(/[0-9]/, t("validation.passwordNumber"))
      .regex(/[^A-Za-z0-9]/, t("validation.passwordSpecial"));

    const newErrors: {
      email?: string;
      password?: string;
      name?: string;
      companyName?: string;
      businessType?: string;
    } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.issues[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.issues[0].message;
      }
    }

    if (isSignUp && !fullName.trim()) {
      newErrors.name = t("validation.fullNameRequired");
    }

    if (isSignUp && userType === "b2b") {
      if (!companyName.trim()) {
        newErrors.companyName = t("validation.companyNameRequired");
      }
      if (!businessType) {
        newErrors.businessType = t("validation.businessTypeRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);

    const { error, needsConfirmation } = await signIn(
      email,
      password,
      userType,
      {
        rememberMe,
      },
    );

    if (needsConfirmation) {
      setIsLoading(false);
      redirectToCheckEmail({
        email,
        source: "email",
        intent: "signin",
      });
      return;
    }

    if (error) {
      setIsLoading(false);
      toast({
        title: t("error"),
        description:
          error.message === "Invalid login credentials"
            ? t("messages.invalidLoginByType", {
                accountType:
                  userType === "b2c"
                    ? t("messages.consumer")
                    : t("messages.business"),
              })
            : error.message,
        variant: "destructive",
      });
    } else {
      if (typeof window !== "undefined" && rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      }
      setIsLoading(false);
      router.push(userType === "b2c" ? "/b2c" : "/overview");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);
    const result = await signUp(email, password, fullName, userType, {
      companyName: userType === "b2b" ? companyName : undefined,
      businessType: userType === "b2b" ? businessType || undefined : undefined,
    });

    if (result.error) {
      setIsLoading(false);
      let errorMessage = result.error.message;
      if (result.error.message.includes("already registered")) {
        errorMessage = t("messages.alreadyRegisteredPleaseLogin");
      }
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      setIsLoading(false);

      if (result.needsConfirmation) {
        toast({
          title: t("messages.checkEmailTitle"),
          description: t("messages.checkEmailDescription"),
          duration: 6000,
        });
        setActiveTab("login");
        redirectToCheckEmail({
          email,
          source: "email",
          intent: "signup",
        });
      } else {
        toast({
          title: t("messages.signupSuccessTitle"),
          description: t("messages.signupSuccessDescription"),
          duration: 3000,
        });
        if (userType === "b2c") {
          router.push("/b2c");
        } else {
          router.push("/overview");
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const intent = activeTab === "signup" ? "signup" : "signin";
    const { error } = await signInWithGoogle(userType, intent, { rememberMe });

    if (error) {
      setIsLoading(false);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (authDisabled) {
    return (
      <Card className="border-border/50 shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">
            {userType === "b2c" ? t("welcome") : t("welcomeb2b")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t("messages.authDisabled")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">
          {userType === "b2c" ? t("welcome") : t("welcomeb2b")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLogin onGoogleLogin={handleGoogleLogin} isLoading={isLoading} />

        <EmailAuthTabs
          userType={userType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          businessType={businessType}
          setBusinessType={setBusinessType}
          errors={errors}
          isLoading={isLoading}
          onLogin={handleEmailLogin}
          onSignUp={handleEmailSignUp}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
        />
      </CardContent>
    </Card>
  );
};

export default AuthForm;
