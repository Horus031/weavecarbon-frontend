/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingForm from "./OnboardingForm";

const OnboardingClient: React.FC = () => {
  const { user, supabaseUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<string>("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);

  useEffect(() => {
    // Wait for loading to complete before any redirects
    if (loading) return;

    // If no user AND no supabaseUser (not authenticated at all), redirect to auth
    if (!user && !supabaseUser) {
      console.log("No user found, redirecting to auth");
      router.push("/auth");
      return;
    }

    // If user profile exists and already has a company, redirect to dashboard
    if (user?.company_id) {
      console.log("User has company_id, redirecting to overview");
      router.push("/overview");
    }
  }, [user, supabaseUser, loading, router]);

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

    // Get auth user ID - either from profile or supabase session
    const authUserId = user?.id || supabaseUser?.id;

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
      // First, ensure user profile exists (for Google OAuth users who might not have one yet)
      if (!user && supabaseUser) {
        const { error: profileError } = await supabase.from("users").insert({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          full_name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            "User",
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          user_type: "b2b",
        });

        if (profileError && !profileError.message.includes("duplicate")) {
          console.error("Profile creation error:", profileError);
          throw new Error(profileError.message || "Failed to create profile");
        }
      }

      // Insert company with proper error handling
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          business_type: businessType as "shop_online" | "brand" | "factory",
          target_markets: targetMarkets.length > 0 ? targetMarkets : null,
          current_plan: "starter",
        })
        .select()
        .single();

      if (companyError) {
        console.error("Company creation error:", companyError);
        throw new Error(companyError.message || "Failed to create company");
      }

      console.log("Company created:", company.id);

      // Update user with company_id
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ company_id: company.id })
        .eq("id", authUserId);

      if (userUpdateError) {
        console.error("User update error:", userUpdateError);
        throw new Error(userUpdateError.message || "Failed to update user");
      }

      console.log("User updated with company_id");

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
