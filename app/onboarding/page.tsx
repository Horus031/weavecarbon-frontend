import React from "react";
import OnboardingClient from "@/components/onboarding/OnboardingClient";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Business Onboarding - WeaveCARBON",
  description:
    "Set up your business profile and start tracking your carbon footprint",
};

const OnboardingPage = () => {
  return (
    <AuthProvider>
      <OnboardingClient />;
    </AuthProvider>
  );
};

export default OnboardingPage;
