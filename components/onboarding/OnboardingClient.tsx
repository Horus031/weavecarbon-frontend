/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/apiClient";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingForm from "./OnboardingForm";

const OnboardingClient: React.FC = () => {
  const { user, loading, refreshUser, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<string>("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);

  useEffect(() => {
    // Wait for loading to complete before any redirects
    if (loading) return;

    // If no user (not authenticated at all), redirect to auth
    if (!user) {
      console.log("No user found, redirecting to auth");
      router.push("/auth");
      return;
    }

    // If user profile exists and already has a company, redirect to dashboard
    if (user?.company_id) {
      console.log("User has company_id, redirecting to overview");
      router.push("/overview");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !businessType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Get auth user ID
    const authUserId = user?.id;

    if (!authUserId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert company with proper error handling
      const company = await api.post<{ id: string }>("/companies", {
        name: companyName,
        business_type: businessType as "shop_online" | "brand" | "factory",
        target_markets: targetMarkets.length > 0 ? targetMarkets : null,
        current_plan: "starter",
      });

      console.log("Company created:", company.id);

      // Update user with company_id
      await api.patch(`/users/${authUserId}`, { company_id: company.id });

      console.log("User updated with company_id");
      updateUser({ company_id: company.id });

      toast({
        title: "Success! 🎉",
        description: "Your company has been created successfully!",
      });

      // Refresh user context
      await refreshUser();

      // Redirect to dashboard
      router.push("/overview");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <OnboardingHeader />
        <OnboardingForm
          companyName={companyName}
          setCompanyName={setCompanyName}
          businessType={businessType}
          setBusinessType={setBusinessType}
          targetMarkets={targetMarkets}
          setTargetMarkets={setTargetMarkets}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default OnboardingClient;
