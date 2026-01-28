import React from "react";
import WeaveyChat from "@/components/ui/WeaveyChat";
import DashboardSidebarShell from "@/components/dashboard/DashboardSidebarShell";
import DashboardHeaderButton from "@/components/dashboard/DashboardHeaderButton";
import PricingModalGate from "@/components/dashboard/PricingModalGate";
import { AuthProvider } from "@/contexts/AuthContext";

interface Company {
  id: string;
  name: string;
  business_type: string;
  current_plan: string;
  target_markets: string[] | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  company_id: string | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

// Mock data (no DB yet)
const mockCompany: Company = {
  id: "company-123",
  name: "WeaveCarbon Demo Co.",
  business_type: "b2b",
  current_plan: "pro",
  target_markets: ["US", "EU"],
};

const mockProfile: Profile = {
  full_name: "Demo User",
  email: "demo@weavecarbon.com",
  company_id: "company-123",
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const company = mockCompany;
  const profile = mockProfile;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex w-full lg:flex-row flex-col">
        <DashboardSidebarShell company={company} profile={profile} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex flex-col">
          <header className="bg-card border-b border-border p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <DashboardHeaderButton />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-display font-bold truncate">Overview</h1>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Overview of your carbon tracking
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-3 md:p-6">{children}</div>
        </main>

        {/* Pricing Modal (client gate) */}
        <PricingModalGate />

        {/* Weavey AI Assistant - Dashboard variant */}
        <WeaveyChat variant="dashboard" />
      </div>
    </AuthProvider>
  );
};

export default DashboardLayout;
