"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, authTokenStore, isUnauthorizedApiError } from "@/lib/apiClient";
import PricingModal from "@/components/dashboard/PricingModal";
import { useToast } from "@/hooks/useToast";

export default function PricingModalGate() {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const checkPricingStatus = async () => {
      if (pathname !== "/overview") {
        setOpen(false);
        return;
      }

      if (loading || !user || user.user_type !== "b2b") {
        setOpen(false);
        return;
      }

      const hasToken = Boolean(
        authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
      );
      if (!hasToken) {
        setOpen(false);
        return;
      }

      try {
        const subscription = await api.get<{current_plan?: string;}>(
          "/subscription"
        );
        if (subscription?.current_plan === "starter") {
          setOpen(true);
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          setOpen(false);
          await signOut();
          return;
        }
      }
    };

    void checkPricingStatus();
  }, [loading, user, pathname, signOut]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user || user.user_type !== "b2b") return;

    try {
      const upgrade = await api.post<{checkout_url?: string;}>(
        "/subscription/upgrade",
        {
          target_plan: planId,
          billing_cycle: "monthly"
        }
      );

      if (upgrade?.checkout_url && typeof window !== "undefined") {
        window.open(upgrade.checkout_url, "_blank", "noopener,noreferrer");
      }

      toast({
        title: "Upgrade Started",
        description: `Checkout for ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan has been created.`
      });

      localStorage.setItem("weavecarbon_pricing_seen", "true");
      setOpen(false);
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        await signOut();
        return;
      }
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <PricingModal
      open={open}
      onClose={handleClose}
      onSelectPlan={handleSelectPlan} />);


}