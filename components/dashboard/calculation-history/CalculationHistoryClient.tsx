"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import { Button } from "@/components/ui/button";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Package } from "lucide-react";
import HistorySummaryStats from "./HistorySummaryStats";
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
  const { setPageTitle } = useDashboardTitle();
  const { history, isLoaded } = useCalculationHistory();

  const filteredHistory = productId
    ? history.filter((h) => h.productId === productId)
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

  React.useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          {t("exportCSV")}
        </Button>
      </div>

      {/* Summary Stats */}
      <HistorySummaryStats history={filteredHistory} />

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
