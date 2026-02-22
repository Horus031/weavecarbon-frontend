"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import { fetchProductById, isValidProductId } from "@/lib/productsApi";
import { Button } from "@/components/ui/button";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
"@/components/ui/card";
import { Download, Package } from "lucide-react";
import HistorySummaryStats from "./HistorySummaryStats";
import HistoryTable from "./HistoryTable";
import HistoryEmptyState from "./HistoryEmptyState";

interface CalculationHistoryClientProps {
  productId?: string | null;
}

const CalculationHistoryClient: React.FC<CalculationHistoryClientProps> = ({
  productId
}) => {
  const { loading } = useAuth();
  const t = useTranslations("calculationHistory");
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const { history, isLoaded } = useCalculationHistory();
  const [fallbackHistory, setFallbackHistory] = React.useState<
    {
      id: string;
      productId: string;
      productName: string;
      materialsCO2: number;
      manufacturingCO2: number;
      transportCO2: number;
      packagingCO2: number;
      totalCO2: number;
      carbonVersion: string;
      createdAt: string;
      createdBy: string;
    } |
    null>(
    null);
  const [fallbackLoading, setFallbackLoading] = React.useState(false);

  const filteredHistory = productId ?
  history.filter((h) => h.productId === productId) :
  history;
  const historyForView =
  filteredHistory.length > 0 ?
  filteredHistory :
  fallbackHistory ?
  [fallbackHistory] :
  [];

  const getProductName = (id: string) => {
    if (fallbackHistory?.productId === id && fallbackHistory.productName) {
      return fallbackHistory.productName;
    }
    return id;
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
    t("csvHeaders.createdBy")];

    const rows = historyForView.map((h) => [
    h.id,
    h.productName,
    h.materialsCO2,
    h.manufacturingCO2,
    h.transportCO2,
    h.packagingCO2,
    h.totalCO2,
    h.carbonVersion,
    h.createdAt,
    h.createdBy]
    );

    const csvContent = [headers, ...rows].
    map((row) => row.join(",")).
    join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${t("csvExportFileName")}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  React.useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  React.useEffect(() => {
    let cancelled = false;

    const loadFallback = async () => {
      if (!productId || filteredHistory.length > 0 || !isValidProductId(productId)) {
        setFallbackHistory(null);
        return;
      }

      setFallbackLoading(true);
      try {
        const product = await fetchProductById(productId);
        if (cancelled) return;

        setFallbackHistory({
          id: `fallback-${product.id}`,
          productId: product.id,
          productName: product.productName || product.productCode || product.id,
          materialsCO2: Number(product.carbonResults?.perProduct?.materials) || 0,
          manufacturingCO2: Number(product.carbonResults?.perProduct?.production) || 0,
          transportCO2: Number(product.carbonResults?.perProduct?.transport) || 0,
          packagingCO2: 0,
          totalCO2: Number(product.carbonResults?.perProduct?.total) || 0,
          carbonVersion: `v${product.version || 1}`,
          createdAt: product.updatedAt || product.createdAt || new Date().toISOString(),
          createdBy: "system"
        });
      } catch {
        if (!cancelled) {
          setFallbackHistory(null);
        }
      } finally {
        if (!cancelled) {
          setFallbackLoading(false);
        }
      }
    };

    void loadFallback();

    return () => {
      cancelled = true;
    };
  }, [filteredHistory.length, productId]);

  if (!isLoaded || loading || fallbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);

  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={handleExportCSV}>

          <Download className="w-4 h-4 mr-2" />
          {t("exportCSV")}
        </Button>
      </div>

      
      <HistorySummaryStats history={historyForView} />

      
      {historyForView.length === 0 ?
      <HistoryEmptyState
        onNavigateAssessment={() => router.push("/assessment")} /> :


      <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/70">
            <CardTitle>{t("detailsTitle")}</CardTitle>
            <CardDescription className="text-slate-600">
              {productId ?
            `${t("productHistoryTitle")}${getProductName(productId)}` :
            t("allCalculations")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryTable
            history={historyForView}
            onProductClick={(id) => router.push(`/summary/${id}`)} />

          </CardContent>
        </Card>
      }

      
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => router.push("/overview")}>

          {t("backToDashboard")}
        </Button>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => router.push("/assessment")}>

          <Package className="w-4 h-4 mr-2" />
          {t("addNewProduct")}
        </Button>
      </div>
    </div>);

};

export default CalculationHistoryClient;