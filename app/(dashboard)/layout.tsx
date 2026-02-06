import React from "react";
import WeaveyChat from "@/components/ui/WeaveyChat";
import DashboardSidebarShell from "@/components/dashboard/DashboardSidebarShell";
import PricingModalGate from "@/components/dashboard/PricingModalGate";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProductProvider } from "@/contexts/ProductContext";
import DashboardLayoutContent from "@/components/dashboard/DashboardLayoutContent";
import { BatchProvider } from "@/contexts/BatchContext";
import { ShipmentProvider } from "@/contexts/ShipmentContext";

interface Company {
  id: string;
  name: string;
  business_type: string;
  current_plan: string;
  target_markets: string[] | null;
}

// interface Profile {
//   full_name: string | null;
//   email: string | null;
//   company_id: string | null;
// }

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Mock data (no DB yet)
const mockCompany: Company = {
  id: "company-123",
  name: "WeaveCarbon Demo Co.",
  business_type: "b2b",
  current_plan: "pro",
  target_markets: ["US", "EU"],
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const company = mockCompany;

  return (
    <AuthProvider>
      <DashboardProvider>
        <ProductProvider>
          <BatchProvider>
            <ShipmentProvider>
              <div className="min-h-fit bg-background flex w-full lg:flex-row flex-col">
                <DashboardSidebarShell company={company} />

                {/* Main Content */}
                <main className="flex-1 lg:pl-64 overflow-auto flex flex-col h-full">
                  <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </main>

                {/* Pricing Modal (client gate) */}
                <PricingModalGate />

                {/* Weavey AI Assistant - Dashboard variant */}
                <WeaveyChat variant="dashboard" />
              </div>
            </ShipmentProvider>
          </BatchProvider>
        </ProductProvider>
      </DashboardProvider>
    </AuthProvider>
  );
};

export default DashboardLayout;
