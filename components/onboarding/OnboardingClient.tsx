"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/apiClient";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingForm from "./OnboardingForm";
import { useTranslations } from "next-intl";

const OnboardingClient: React.FC = () => {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations("onboarding");
  const isGoogleFlow = searchParams.get("source") === "google";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<string>("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth");
      return;
    }

    if (user.company_id && !isGoogleFlow) {
      router.push("/overview");
    }
  }, [user, loading, router, isGoogleFlow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !businessType) {
      toast({
        title: t("error"),
        description: t("fillRequired"),
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("error"),
        description: t("userNotAuthenticated"),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const companyPayload = {
        name: companyName,
        business_type: businessType as "shop_online" | "brand" | "factory",
        target_markets: targetMarkets
      };

      if (user.company_id) {
        await api.put("/account/company", companyPayload);
      } else {
        try {
          await api.post("/account/company", companyPayload);
        } catch (error) {
          const message =
          error instanceof Error ? error.message.toLowerCase() : "";
          const canFallbackToUpdate =
          message.includes("already") ||
          message.includes("duplicate") ||
          message.includes("exists");

          if (!canFallbackToUpdate) {
            throw error;
          }

          await api.put("/account/company", companyPayload);
        }
      }

      toast({
        title: t("success"),
        description: t("companySaved")
      });

      await refreshUser();
      router.push("/overview");
    } catch (error) {
      const message =
      error instanceof Error ? error.message : "Something went wrong";
      console.error("Onboarding error:", error);
      toast({
        title: t("error"),
        description: message,
        variant: "destructive"
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
          <p className="text-muted-foreground">{t("loadingProfile")}</p>
        </div>
      </div>);

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
          onSubmit={handleSubmit} />

      </div>
    </div>);

};

export default OnboardingClient;
