"use client";

import React from "react";
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
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "all" | "demo" | "real")} className="mb-6">
      <TabsList>
        <TabsTrigger value="all">Tất cả ({totalCount})</TabsTrigger>
        <TabsTrigger value="demo">
          <Badge variant="outline" className="mr-2">
            Demo
          </Badge>
          ({demoCount})
        </TabsTrigger>
        <TabsTrigger value="real">
          <Badge variant="default" className="mr-2">
            Thực
          </Badge>
          ({realCount})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default HistoryFilterTabs;
