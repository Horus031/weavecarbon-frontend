"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { useToast } from "@/hooks/useToast";
import SocialLogin from "@/components/auth/SocialLogin";
import EmailAuthTabs from "@/components/auth/EmailAuthTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const AuthForm: React.FC = () => {
  const t = useTranslations("auth");
  const { signUp, signIn, signInWithGoogle, signInAsDemo, user, loading } =
    useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get user type from query string, default to b2b
  const userType = (searchParams.get("type") as "b2b" | "b2c") || "b2b";

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});

  const getDashboardPath = useCallback(
    (type: "b2b" | "b2c" | "admin" | undefined) => {
      return type === "b2c" ? "/b2c" : "/overview";
    },
    [],
  );

  // Redirect logic based on user type and company_id
  useEffect(() => {
    if (user && !loading) {
      // B2B users need company setup via onboarding
      if (user.user_type === "b2b" && !user.company_id) {
        router.push("/onboarding");
      } else {
        // Redirect to appropriate dashboard based on user type
        router.push(getDashboardPath(user.user_type));
      }
    }
  }, [user, loading, router, getDashboardPath]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);
    // Pass userType to signIn to login to the correct account type
    const { error } = await signIn(email, password, userType);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description:
          error.message === "Invalid login credentials"
            ? `No ${userType === "b2c" ? "consumer" : "business"} account found with this email and password`
            : error.message,
        variant: "destructive",
      });
    } else {
      setIsLoading(false);
      // Redirect will be handled by useEffect
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);
    const result = await signUp(email, password, fullName, userType);

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
        variant: "destructive",
      });
    } else {
      setIsLoading(false);

      if (result.needsConfirmation) {
        // Email confirmation is required
        toast({
          title: "Check your email",
          description:
            "We've sent you a confirmation link. Please check your email to continue.",
          duration: 6000,
        });
        setActiveTab("login");
      } else {
        // Account created and auto-logged in
        toast({
          title: "Success! 🎉",
          description: "Your account has been created successfully!",
          duration: 3000,
        });
        // Redirect based on user type
        if (userType === "b2c") {
          router.push("/b2c");
        } else {
          router.push("/onboarding");
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    // Redirect will be handled by callback
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const { error } = await signInAsDemo(userType);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsLoading(false);
      // Redirect based on user type
      if (userType === "b2c") {
        router.push("/b2c");
      } else {
        router.push("/onboarding");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // const getSubtitle = () => {
  //   if (userType === "b2c") {
  //     return "Sign in to track your fashion carbon footprint";
  //   }
  //   return "Sign in to access your business dashboard";
  // };

  const getDemoButtonText = () => {
    return userType === "b2c" ? "Try Consumer Demo" : "Try Business Demo";
  };

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">
          {userType === "b2c"
            ? t("welcome")
            : t("welcomeb2b")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLogin
          onDemoLogin={handleDemoLogin}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          demoButtonText={getDemoButtonText()}
        />

        <EmailAuthTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          errors={errors}
          isLoading={isLoading}
          onLogin={handleEmailLogin}
          onSignUp={handleEmailSignUp}
        />
      </CardContent>
    </Card>
  );
};

export default AuthForm;
