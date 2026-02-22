import React from "react";
import DashboardSidebarShell from "@/components/dashboard/DashboardSidebarShell";
import PricingModalGate from "@/components/dashboard/PricingModalGate";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProductProvider } from "@/contexts/ProductContext";
import DashboardLayoutContent from "@/components/dashboard/DashboardLayoutContent";
import { BatchProvider } from "@/contexts/BatchContext";
import { ShipmentProvider } from "@/contexts/ShipmentContext";
import RouteWeaveyChat from "@/components/ui/RouteWeaveyChat";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <DashboardProvider>
      <ProductProvider>
        <BatchProvider>
          <ShipmentProvider>
            <div className="min-h-fit bg-background flex w-full lg:flex-row flex-col">
              <DashboardSidebarShell company={null} />

              
              <main className="flex-1 pt-12 md:pt-0 lg:pl-64 overflow-auto flex flex-col h-full">
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
              </main>

              
              <PricingModalGate />
              <RouteWeaveyChat />
            </div>
          </ShipmentProvider>
        </BatchProvider>
      </ProductProvider>
    </DashboardProvider>);

};

export default DashboardLayout;