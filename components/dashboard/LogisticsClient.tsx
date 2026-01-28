"use client";

import React, { useEffect } from "react";
import ShippingOverviewMap from "./logistic/ShippingOverviewMap";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const LogisticsPage: React.FC = () => {
  const navigate = useRouter();

  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Logistics", "Overview of your carbon tracking");
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quản lý vận chuyển</h2>
          <p className="text-muted-foreground">
            Theo dõi tất cả các lô hàng trên bản đồ thế giới
          </p>
        </div>
      </div>

      <ShippingOverviewMap
        onViewDetails={() => navigate.push("/track-shipment")}
      />
    </div>
  );
};

export default LogisticsPage;
