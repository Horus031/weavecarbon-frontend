"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import ShippingOverviewMap from "./logistic/ShippingOverviewMap";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const LogisticsPage: React.FC = () => {
  const t = useTranslations("logistics");
  const navigate = useRouter();

  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Logistics", "Overview of your carbon tracking");
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("subtitle")}
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
