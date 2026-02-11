import React from "react";
import DashboardSidebarShell from "@/components/dashboard/DashboardSidebarShell";
import PricingModalGate from "@/components/dashboard/PricingModalGate";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProductProvider } from "@/contexts/ProductContext";
import DashboardLayoutContent from "@/components/dashboard/DashboardLayoutContent";
import { BatchProvider } from "@/contexts/BatchContext";
import { ShipmentProvider } from "@/contexts/ShipmentContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      <DashboardProvider>
        <ProductProvider>
          <BatchProvider>
            <ShipmentProvider>
              <div className="min-h-fit bg-background flex w-full lg:flex-row flex-col">
                <DashboardSidebarShell company={null} />

                {/* Main Content */}
                <main className="flex-1 pt-12 md:pt-0 lg:pl-64 overflow-auto flex flex-col h-full">
                  <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </main>

                {/* Pricing Modal (client gate) */}
                <PricingModalGate />
              </div>
            </ShipmentProvider>
          </BatchProvider>
        </ProductProvider>
      </DashboardProvider>
    </AuthProvider>
  );
};

export default DashboardLayout;
