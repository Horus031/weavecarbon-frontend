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
import AuthLayout from "@/app/auth/layout";
import { useParams, useRouter } from "next/navigation";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const AuthForm: React.FC = () => {
  const {
    signUp,
    signIn,
    signInWithGoogle,
    signInAsDemo,
    user,
    loading,
    setRole,
  } = useAuth();
  const navigate = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const userType = params?.type as string as "b2b" | "b2c" | null;

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

  const getDashboardPath = useCallback(() => {
    return userType === "b2c" ? "/b2c-dashboard" : "/dashboard";
  }, [userType]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate.push(getDashboardPath());
    }
  }, [user, loading, navigate, getDashboardPath]);

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
    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description:
          error.message === "Invalid login credentials"
            ? "Invalid email or password"
            : error.message,
        variant: "destructive",
      });
    } else {
      if (userType) {
        await setRole(userType);
      }
      setIsLoading(false);
      navigate.push(getDashboardPath());
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setIsLoading(false);
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      if (userType) {
        await setRole(userType);
      }
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate.push(userType === "b2c" ? "/b2c-dashboard" : "/onboarding");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const { error } = await signInAsDemo();

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (userType) {
        await setRole(userType);
      }
      setIsLoading(false);
      navigate.push(getDashboardPath());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{"Welcome to WEAVECARBON"}</CardTitle>
        <CardDescription>Sign in to access your B2B dashboard</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLogin
          onDemoLogin={handleDemoLogin}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
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
