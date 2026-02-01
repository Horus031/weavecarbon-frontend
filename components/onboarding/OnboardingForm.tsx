"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import BusinessTypeSelector from "./BusinessTypeSelector";
import TargetMarketSelector from "./TargetMarketSelector";
import PlanInfo from "./PlanInfo";

interface OnboardingFormProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  businessType: string;
  setBusinessType: (type: string) => void;
  targetMarkets: string[];
  setTargetMarkets: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({
  companyName,
  setCompanyName,
  businessType,
  setBusinessType,
  targetMarkets,
  setTargetMarkets,
  isSubmitting,
  onSubmit,
}) => {
  const toggleMarket = (market: string) => {
    setTargetMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market],
    );
  };

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set Up Your Business</CardTitle>
        <CardDescription>
          Tell us about your company to get started
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              type="text"
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Business Type */}
          <BusinessTypeSelector
            value={businessType}
            onChange={setBusinessType}
            disabled={isSubmitting}
          />

          {/* Target Markets */}
          <TargetMarketSelector
            selectedMarkets={targetMarkets}
            onToggle={toggleMarket}
            disabled={isSubmitting}
          />

          {/* Plan Info */}
          <PlanInfo />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Continue to Dashboard"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OnboardingForm;
