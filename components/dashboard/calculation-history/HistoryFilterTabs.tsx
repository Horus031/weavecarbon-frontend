"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HistoryFilterTabsProps {
  activeTab: "all" | "demo" | "real";
  onTabChange: (tab: "all" | "demo" | "real") => void;
  totalCount: number;
  demoCount: number;
  realCount: number;
}

const HistoryFilterTabs: React.FC<HistoryFilterTabsProps> = ({
  activeTab,
  onTabChange,
  totalCount,
  demoCount,
  realCount,
}) => {
  const t = useTranslations("calculationHistory");
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "all" | "demo" | "real")} className="mb-6">
      <TabsList>
        <TabsTrigger value="all">{t("filterAll")} ({totalCount})</TabsTrigger>
        <TabsTrigger value="demo">
          <Badge variant="outline" className="mr-2">
            {t("filterDemo")}
          </Badge>
          ({demoCount})
        </TabsTrigger>
        <TabsTrigger value="real">
          <Badge variant="default" className="mr-2">
            {t("filterReal")}
          </Badge>
          ({realCount})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default HistoryFilterTabs;
