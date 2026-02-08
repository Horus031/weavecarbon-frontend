"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { History, Download, Info, Package } from "lucide-react";
import HistorySummaryStats from "./HistorySummaryStats";
import HistoryFilterTabs from "./HistoryFilterTabs";
import HistoryTable from "./HistoryTable";
import HistoryEmptyState from "./HistoryEmptyState";

interface CalculationHistoryClientProps {
  productId?: string | null;
}

const CalculationHistoryClient: React.FC<CalculationHistoryClientProps> = ({
  productId,
}) => {
  const { loading } = useAuth();
  const t = useTranslations("calculationHistory");
  const router = useRouter();
  const { history, isLoaded, getDemoHistory, getRealHistory } = useCalculationHistory();
  const [activeTab, setActiveTab] = useState<"all" | "demo" | "real">("all");

  const filteredHistory = productId
    ? history.filter((h) => h.productId === productId)
    : activeTab === "demo"
      ? getDemoHistory()
      : activeTab === "real"
        ? getRealHistory()
        : history;

  const getProductName = (id: string) => {
    return id; // Since we don't have the products list, just return the ID
  };

  const handleExportCSV = () => {
    const headers = [
      t("csvHeaders.id"),
      t("csvHeaders.product"),
      t("csvHeaders.materials"),
      t("csvHeaders.manufacturing"),
      t("csvHeaders.transport"),
      t("csvHeaders.packaging"),
      t("csvHeaders.totalCO2"),
      t("csvHeaders.version"),
      t("csvHeaders.createdDate"),
      t("csvHeaders.createdBy"),
      t("csvHeaders.type"),
    ];
    const rows = filteredHistory.map((h) => [
      h.id,
      h.productName,
      h.materialsCO2,
      h.manufacturingCO2,
      h.transportCO2,
      h.packagingCO2,
      h.totalCO2,
      h.carbonVersion,
      h.createdAt,
      h.createdBy,
      h.isDemo ? t("csvTypeDemo") : t("csvTypeReal"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${t("csvExportFileName")}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            {t("title")}
          </h2>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          {t("exportCSV")}
        </Button>
      </div>

      {/* Demo Notice */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-amber-800 text-sm font-medium">
            {t("demoDataDescription")}
          </p>
          <p className="text-amber-700 text-xs mt-1">
            {t("demoDataNote")}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <HistorySummaryStats history={filteredHistory} />

      {/* Filter Tabs */}
      {!productId && (
        <HistoryFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={history.length}
          demoCount={getDemoHistory().length}
          realCount={getRealHistory().length}
        />
      )}

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <HistoryEmptyState
          onNavigateAssessment={() => router.push("/assessment")}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
            <CardDescription>
              {productId
                ? `${t("productHistoryTitle")}${getProductName(productId)}`
                : t("allCalculations")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryTable
              history={filteredHistory}
              onProductClick={(id) => router.push(`/product-summary?id=${id}`)}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/overview")}>
          {t("backToDashboard")}
        </Button>
        <Button onClick={() => router.push("/assessment")}>
          <Package className="w-4 h-4 mr-2" />
          {t("addNewProduct")}
        </Button>
      </div>
    </div>
  );
};

export default CalculationHistoryClient;
