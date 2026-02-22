"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
"@/components/ui/card";
import { z } from "zod";
import { useToast } from "@/hooks/useToast";
import SocialLogin from "@/components/auth/SocialLogin";
import EmailAuthTabs from "@/components/auth/EmailAuthTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.
string().
min(8, "Password must be at least 8 characters").
regex(/[A-Z]/, "Password must include at least one uppercase letter").
regex(/[a-z]/, "Password must include at least one lowercase letter").
regex(/[0-9]/, "Password must include at least one number").
regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const AuthForm: React.FC = () => {
  const t = useTranslations("auth");
  const { signUp, signIn, signInWithGoogle, signOut, user, loading } =
  useAuth();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "1";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();


  const userType = searchParams.get("type") as "b2b" | "b2c" || "b2b";
  const forceLogin = searchParams.get("forceLogin") === "1";
  const forceSignOutDoneRef = useRef(false);
  const forceLoginCheckedRef = useRef(false);
  const handledAuthErrorRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<
    "" | "shop_online" | "brand" | "factory">(
    "");
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
    []
  );


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

    let message = errorDescription || errorCode;

    switch (errorCode) {
      case "GOOGLE_ACCOUNT_NOT_FOUND":
        message =
        "Tài khoản Google chưa được đăng ký. Vui lòng chuyển qua tab Đăng ký và thử lại.";
        break;
      case "GOOGLE_EMAIL_ALREADY_REGISTERED":
        message =
        "Email đã tồn tại. Vui lòng chuyển qua tab Đăng nhập và thử lại.";
        break;
      case "INVALID_OAUTH_STATE":
        message = "Phiên Google OAuth đã hết hạn. Vui lòng bấm lại nút Google.";
        break;
      case "GOOGLE_TOKEN_EXCHANGE_FAILED":
      case "GOOGLE_USERINFO_FAILED":
      case "GOOGLE_AUTH_FAILED":
        message = "Đăng nhập Google tạm thời lỗi. Vui lòng thử lại thủ công.";
        break;
      case "MISSING_CODE":
      case "missing_tokens":
        message = "Callback Google không hợp lệ. Vui lòng đăng nhập lại.";
        break;
      default:
        break;
    }

    toast({
      title: "Google Authentication Error",
      description: message,
      variant: "destructive"
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("error_description");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/auth?${nextQuery}` : "/auth");
  }, [searchParams, toast, router]);

  const validateForm = (isSignUp: boolean) => {
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
      newErrors.name = "Full name is required";
    }

    if (isSignUp && userType === "b2b") {
      if (!companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!businessType) {
        newErrors.businessType = "Business type is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);

    const { error } = await signIn(email, password, userType);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description:
        error.message === "Invalid login credentials" ?
        `No ${userType === "b2c" ? "consumer" : "business"} account found with this email and password` :
        error.message,
        variant: "destructive"
      });
    } else {
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
      businessType: userType === "b2b" ? businessType || undefined : undefined
    });

    if (result.error) {
      setIsLoading(false);
      let errorMessage = result.error.message;
      if (result.error.message.includes("already registered")) {
        errorMessage =
        "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      setIsLoading(false);

      if (result.needsConfirmation) {

        toast({
          title: "Check your email",
          description:
          "We've sent you a confirmation link. Please check your email to continue.",
          duration: 6000
        });
        setActiveTab("login");
      } else {

        toast({
          title: "Success! 🎉",
          description: "Your account has been created successfully!",
          duration: 3000
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
    const { error } = await signInWithGoogle(userType, intent);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);

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
            Authentication is currently disabled.
          </p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">
          {userType === "b2c" ?
          t("welcome") :
          t("welcomeb2b")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLogin
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading} />


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
          onSignUp={handleEmailSignUp} />
        
      </CardContent>
    </Card>);

};

export default AuthForm;