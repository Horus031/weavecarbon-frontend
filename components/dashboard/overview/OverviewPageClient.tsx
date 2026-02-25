
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/ProductContext";
import { api } from "@/lib/apiClient";
import { showNoPermissionToast } from "@/lib/noPermissionToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Truck,
  FileCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Target,
  Gauge,
  Lightbulb,
  PlusCircle } from
"lucide-react";
import { useLocale, useTranslations } from "next-intl";
import ProductOverviewModal from "../assessment/ProductOverviewModal";
import OverviewCharts, {
  EmissionBreakdownPoint,
  TrendDataPoint } from
"../OverviewCharts";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Company {
  target_markets: string[] | null;
  name?: string;
}

interface MarketReadinessItem {
  market: string;
  score: number;
  status?: "good" | "warning" | "danger";
}

interface RecommendationItem {
  id: string | number;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  reduction: string;
}

interface OverviewStats {
  totalCO2: number;
  skuCount: number;
  exportReadiness: number;
  confidenceScore: number;
}

interface DashboardOverviewResponse {
  stats?: {
    total_co2e?: number;
    total_skus?: number;
    avg_export_readiness?: number;
    data_confidence?: number;
  };
  carbon_trend?: Array<{
    month?: string;
    label?: string;
    actual_emissions?: number;
    target_emissions?: number;
  }>;
  emission_breakdown?: Array<{
    category?: string;
    label?: string;
    percentage?: number;
    color?: string;
  }>;
  market_readiness?: Array<{
    market_code?: string;
    market_name?: string;
    score?: number;
    status?: "good" | "warning" | "danger";
  }>;
  recommendations?: Array<{
    id: string | number;
    title?: string;
    description?: string;
    impact_level?: "high" | "medium" | "low";
    reduction_percentage?: number;
  }>;
}

const EMISSION_COLOR_PALETTE = [
"hsl(150 58% 38%)",
"hsl(217 91% 60%)",
"hsl(35 92% 58%)",
"hsl(262 83% 63%)",
"hsl(0 84% 60%)",
"hsl(188 96% 35%)"];


const normalizeEmissionKey = (value: string) =>
value.
toLowerCase().
normalize("NFD").
replace(/[\u0300-\u036f]/g, "").
replace(/[^a-z0-9]+/g, " ").
trim();

const getCategoryColor = (label: string) => {
  const key = normalizeEmissionKey(label);

  if (
  key.includes("material") ||
  key.includes("materials") ||
  key.includes("vat lieu") ||
  key.includes("nguyen lieu"))
  {
    return EMISSION_COLOR_PALETTE[0];
  }

  if (
  key.includes("production") ||
  key.includes("manufacturing") ||
  key.includes("san xuat"))
  {
    return EMISSION_COLOR_PALETTE[1];
  }

  if (
  key.includes("transport") ||
  key.includes("transportation") ||
  key.includes("logistics") ||
  key.includes("shipping") ||
  key.includes("van chuyen"))
  {
    return EMISSION_COLOR_PALETTE[2];
  }

  if (key.includes("packaging") || key.includes("dong goi")) {
    return EMISSION_COLOR_PALETTE[3];
  }

  return null;
};

const pickEmissionColor = (
label: string,
apiColor: string | undefined,
usedColors: Set<string>,
index: number) =>
{
  const preferred = getCategoryColor(label);
  if (preferred && !usedColors.has(preferred.toLowerCase())) {
    usedColors.add(preferred.toLowerCase());
    return preferred;
  }

  const cleanApiColor = apiColor?.trim();
  const apiKey = cleanApiColor?.toLowerCase();

  if (cleanApiColor && apiKey && !usedColors.has(apiKey)) {
    usedColors.add(apiKey);
    return cleanApiColor;
  }

  const fallback =
  EMISSION_COLOR_PALETTE.find(
    (color) => !usedColors.has(color.toLowerCase())
  ) || EMISSION_COLOR_PALETTE[index % EMISSION_COLOR_PALETTE.length];

  usedColors.add(fallback.toLowerCase());
  return fallback;
};

const getReadinessColor = (score: number) => {
  if (score >= 75) return "border border-emerald-300 bg-emerald-100 text-emerald-800";
  if (score >= 50) return "border border-amber-300 bg-amber-100 text-amber-800";
  return "border border-rose-300 bg-rose-100 text-rose-800";
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "border border-emerald-300 bg-emerald-100 text-emerald-800";
    case "medium":
      return "border border-amber-300 bg-amber-100 text-amber-800";
    default:
      return "border border-sky-300 bg-sky-100 text-sky-800";
  }
};

const OverviewPage: React.FC = () => {
  const t = useTranslations("overview");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";
  const { canMutate } = usePermissions();
  const { user } = useAuth();
  const { products, pendingProductData, clearPendingProduct } = useProducts();
  const navigate = useRouter();
  const [, setCompany] = useState<Company | null>(null);
  const [apiStats, setApiStats] = useState<OverviewStats | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [marketReadiness, setMarketReadiness] = useState<MarketReadinessItem[]>(
    []
  );
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [emissionBreakdown, setEmissionBreakdown] = useState<
    EmissionBreakdownPoint[]>(
    []);
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle(t("pageTitle"), t("pageSubtitle"));
  }, [setPageTitle, t]);

  useEffect(() => {
    if (pendingProductData) {
      setShowProductModal(true);
    }
  }, [pendingProductData]);

  const handleCloseModal = () => {
    setShowProductModal(false);
    clearPendingProduct();
  };

  const localStats = useMemo(() => {
    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
    const skuCount = products.length;
    const publishedCount = products.filter(
      (p) => p.status === "published"
    ).length;
    const avgConfidence =
    products.length > 0 ?
    Math.round(
      products.reduce((sum, p) => sum + p.confidenceScore, 0) /
      products.length
    ) :
    0;

    const exportReadiness =
    products.length > 0 ?
    Math.round(
      publishedCount / products.length * 50 + avgConfidence * 0.5
    ) :
    0;

    return {
      totalCO2: Math.round(totalCO2 * 100) / 100,
      skuCount,
      exportReadiness: Math.min(exportReadiness, 100),
      confidenceScore: avgConfidence
    };
  }, [products]);

  const stats = apiStats || localStats;

  const localFallbackTrendData = useMemo((): TrendDataPoint[] => {
    if (products.length === 0) return [];

    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
    const monthLabel = `M${new Date().getMonth() + 1}`;

    return [
    {
      month: monthLabel,
      emissions: Math.round(totalCO2 * 100) / 100,
      target: Math.round(totalCO2 * 1.1 * 100) / 100
    }];

  }, [products]);

  useEffect(() => {
    let cancelled = false;

    const fetchOverviewData = async () => {
      if (!user) {
        if (!cancelled) {
          setApiStats(null);
          setMarketReadiness([]);
          setRecommendations([]);
          setTrendData([]);
          setEmissionBreakdown([]);
          setInsightsLoading(false);
        }
        return;
      }

      if (!cancelled) setInsightsLoading(true);

      try {
        const overview = await api.get<DashboardOverviewResponse>(
          "/dashboard/overview?trend_months=6"
        );

        if (cancelled) return;

        setApiStats({
          totalCO2: Math.round((overview.stats?.total_co2e || 0) * 100) / 100,
          skuCount: overview.stats?.total_skus || 0,
          exportReadiness: Math.round(overview.stats?.avg_export_readiness || 0),
          confidenceScore: Math.round(overview.stats?.data_confidence || 0)
        });

        setCompany({
          target_markets:
          overview.market_readiness?.map((item) => item.market_code || "") || []
        });

        setMarketReadiness(
          (overview.market_readiness || []).map((item) => ({
            market: item.market_name || item.market_code || "Unknown",
            score: Math.round(item.score || 0),
            status: item.status
          }))
        );

        setRecommendations(
          (overview.recommendations || []).map((item) => ({
            id: item.id,
            title: item.title || "Recommendation",
            description: item.description || "",
            impact: item.impact_level || "medium",
            reduction: `${Math.round(item.reduction_percentage || 0)}%`
          }))
        );

        setTrendData(
          (overview.carbon_trend || []).map((point) => ({
            month: point.label || point.month || "-",
            emissions: Math.round((point.actual_emissions || 0) * 100) / 100,
            target: Math.round((point.target_emissions || 0) * 100) / 100
          }))
        );

        const usedBreakdownColors = new Set<string>();
        setEmissionBreakdown(
          (overview.emission_breakdown || []).map((item, index) => {
            const name = item.label || item.category || "unknown";
            return {
              name,
              value: Math.round(item.percentage || 0),
              color: pickEmissionColor(
                name,
                item.color,
                usedBreakdownColors,
                index
              )
            };
          })
        );
      } catch {
        if (cancelled) return;

        setApiStats(null);
        setMarketReadiness([]);
        setRecommendations([]);
        setTrendData([]);
        setEmissionBreakdown([]);
      }

      setInsightsLoading(false);
    };

    fetchOverviewData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const chartTrendData = trendData.length > 0 ? trendData : localFallbackTrendData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100 pb-2">
            <CardDescription className="text-slate-700">
              {t("stats.totalCO2")}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {stats.totalCO2.toLocaleString(displayLocale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-700">
              {t("stats.kgCO2eThisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100 pb-2">
            <CardDescription className="text-slate-700">
              {t("stats.skuTracking")}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {stats.skuCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-700">
              {t("stats.activeProducts")}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100 pb-2">
            <CardDescription className="text-slate-700">
              {t("stats.exportReadiness")}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              {stats.exportReadiness}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Progress
              value={stats.exportReadiness}
              className="h-2 bg-slate-300" />

          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100 pb-2">
            <CardDescription className="text-slate-700">
              {t("stats.dataReliability")}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-700">
              {stats.confidenceScore}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Gauge className="w-4 h-4" />
              <span>{t("stats.basedOnSKUs", { count: stats.skuCount })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts
        carbonTrendData={chartTrendData}
        emissionBreakdown={emissionBreakdown}
        isLoading={insightsLoading} />


      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t("marketReadiness.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("marketReadiness.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-white pt-5">
            {insightsLoading ?
            <div className="h-28 rounded-md border border-slate-300 bg-slate-200/70 animate-pulse" /> :
            marketReadiness.length === 0 ?
            <p className="text-sm text-slate-700">
                No market readiness data yet.
              </p> :

            marketReadiness.map((market) =>
            <div
              key={market.market}
              className="space-y-2 rounded-lg border border-slate-300 bg-slate-50 p-3">

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {market.market}
                      </span>
                      <Badge
                    className={getReadinessColor(market.score)}
                    variant="secondary">

                        {market.score >= 75 ?
                    <CheckCircle2 className="w-3 h-3 mr-1" /> :

                    <AlertCircle className="w-3 h-3 mr-1" />
                    }
                        {market.score}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={market.score} className="h-2 bg-slate-300" />
                </div>
            )
            }
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("recommendations.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("recommendations.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-white pt-5">
            {insightsLoading ?
            <div className="h-28 rounded-md border border-slate-300 bg-slate-200/70 animate-pulse" /> :
            recommendations.length === 0 ?
            <p className="text-sm text-slate-700">
                No recommendations available.
              </p> :

            recommendations.map((rec) =>
            <div
              key={rec.id}
              className="rounded-lg border border-slate-300 bg-slate-50 p-3 transition-colors hover:bg-slate-100">

                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-slate-900">
                      {rec.title}
                    </h4>
                    <Badge
                  className={getImpactColor(rec.impact)}
                  variant="secondary">

                      -{rec.reduction}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">
                    {rec.description}
                  </p>
                </div>
            )
            }
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:border-primary/55 hover:shadow-md"
          onClick={() => {
            if (!canMutate) {
              showNoPermissionToast();
              return;
            }
            navigate.push("/products");
          }}>

          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
            <PlusCircle className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.addProduct.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("quickActions.addProduct.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100">

              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:border-primary/55 hover:shadow-md"
          onClick={() => navigate.push("/logistics")}>

          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
            <Truck className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.trackShipment.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("quickActions.trackShipment.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100">

              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:border-primary/55 hover:shadow-md"
          onClick={() => navigate.push("/reports")}>

          <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
            <FileCheck className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.generateReport.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("quickActions.generateReport.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100">

              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {pendingProductData &&
      <ProductOverviewModal
        open={showProductModal}
        onClose={handleCloseModal}
        productData={pendingProductData} />

      }
    </div>);

};

export default OverviewPage;
