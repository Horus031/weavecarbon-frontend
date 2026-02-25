import React from "react";
import DashboardSidebarShell from "@/components/dashboard/DashboardSidebarShell";
import PricingModalGate from "@/components/dashboard/PricingModalGate";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProductProvider } from "@/contexts/ProductContext";
import DashboardLayoutContent from "@/components/dashboard/DashboardLayoutContent";
import { BatchProvider } from "@/contexts/BatchContext";
import { ShipmentProvider } from "@/contexts/ShipmentContext";
import RouteWeaveyChat from "@/components/ui/RouteWeaveyChat";
import ScopedIntlProvider from "@/components/i18n/ScopedIntlProvider";
import { DASHBOARD_BASE_NAMESPACES } from "@/lib/i18n/namespaces";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <ScopedIntlProvider namespaces={DASHBOARD_BASE_NAMESPACES}>
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
      </DashboardProvider>
    </ScopedIntlProvider>);

};

export default DashboardLayout;
