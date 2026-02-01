/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import PricingModal from "@/components/dashboard/PricingModal";
import { useToast } from "@/hooks/useToast";

export default function PricingModalGate() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const checkPricingStatus = async () => {
      // Only show on overview page
      if (pathname !== "/overview") {
        setOpen(false);
        return;
      }

      // Don't show if no user or no company
      if (!user?.company_id) return;

      try {
        // Fetch company to check current_plan
        const { data: company, error } = await supabase
          .from("companies")
          .select("current_plan")
          .eq("id", user.company_id)
          .single();

        if (error) {
          console.error("Error fetching company plan:", error);
          return;
        }

        // Show modal if plan is 'starter' (default plan after onboarding)
        // This means user hasn't upgraded yet
        if (company?.current_plan === "starter") {
          // Always show on overview page for starter plan users
          setOpen(true);
        }
      } catch (error) {
        console.error("Error checking pricing status:", error);
      }
    };

    checkPricingStatus();
  }, [user?.company_id, pathname]);

  const handleClose = () => {
    // Just close the modal, it will show again when user returns to overview
    setOpen(false);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user?.company_id) return;

    try {
      // Update company plan in database
      const { error } = await supabase
        .from("companies")
        .update({ current_plan: planId })
        .eq("id", user.company_id);

      if (error) {
        console.error("Error updating plan:", error);
        toast({
          title: "Error",
          description: "Failed to update plan. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Plan Updated! 🎉",
        description: `You've selected the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
      });

      // Mark as permanently seen after selecting a plan
      localStorage.setItem("weavecarbon_pricing_seen", "true");
      setOpen(false);
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PricingModal
      open={open}
      onClose={handleClose}
      onSelectPlan={handleSelectPlan}
    />
  );
}
