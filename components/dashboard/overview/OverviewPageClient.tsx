/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/ProductContext";
import { api } from "@/lib/apiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  PlusCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import ProductOverviewModal from "../assessment/ProductOverviewModal";
import OverviewCharts, {
  EmissionBreakdownPoint,
  TrendDataPoint,
} from "../OverviewCharts";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";

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

interface OverviewMetricsResponse {
  carbonTrendData?: TrendDataPoint[];
  emissionBreakdown?: EmissionBreakdownPoint[];
}

const getReadinessColor = (score: number) => {
  if (score >= 75) return "text-green-600 bg-green-100";
  if (score >= 50) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "bg-green-100 text-green-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};

const OverviewPage: React.FC = () => {
  const t = useTranslations("overview");
  const { user } = useAuth();
  const { products, pendingProductData, clearPendingProduct } = useProducts();
  const navigate = useRouter();
  const [, setCompany] = useState<Company | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [marketReadiness, setMarketReadiness] = useState<MarketReadinessItem[]>(
    [],
  );
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    [],
  );
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [emissionBreakdown, setEmissionBreakdown] = useState<
    EmissionBreakdownPoint[]
  >([]);
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

  const stats = useMemo(() => {
    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
    const skuCount = products.length;
    const publishedCount = products.filter(
      (p) => p.status === "published",
    ).length;
    const avgConfidence =
      products.length > 0
        ? Math.round(
            products.reduce((sum, p) => sum + p.confidenceScore, 0) /
              products.length,
          )
        : 0;

    const exportReadiness =
      products.length > 0
        ? Math.round(
            (publishedCount / products.length) * 50 + avgConfidence * 0.5,
          )
        : 0;

    return {
      totalCO2: Math.round(totalCO2 * 100) / 100,
      skuCount,
      exportReadiness: Math.min(exportReadiness, 100),
      confidenceScore: avgConfidence,
    };
  }, [products]);

  const localFallbackTrendData = useMemo((): TrendDataPoint[] => {
    if (products.length === 0) return [];

    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
    const monthLabel = `M${new Date().getMonth() + 1}`;

    return [
      {
        month: monthLabel,
        emissions: Math.round(totalCO2 * 100) / 100,
        target: Math.round(totalCO2 * 1.1 * 100) / 100,
      },
    ];
  }, [products]);

  useEffect(() => {
    let cancelled = false;

    const fetchOverviewData = async () => {
      const companyId = user?.company_id;
      if (!companyId) {
        if (!cancelled) {
          setMarketReadiness([]);
          setRecommendations([]);
          setTrendData([]);
          setEmissionBreakdown([]);
          setInsightsLoading(false);
        }
        return;
      }

      if (!cancelled) setInsightsLoading(true);

      const [companyResult, readinessResult, recommendationResult, metricsResult] =
        await Promise.allSettled([
          api.get<Company>(`/companies/${companyId}`),
          api.get<MarketReadinessItem[]>(`/companies/${companyId}/market-readiness`),
          api.get<RecommendationItem[]>(`/companies/${companyId}/recommendations`),
          api.get<OverviewMetricsResponse>(`/companies/${companyId}/overview-metrics`),
        ]);

      if (cancelled) return;

      if (companyResult.status === "fulfilled") {
        setCompany(companyResult.value);
      }

      if (readinessResult.status === "fulfilled") {
        setMarketReadiness(readinessResult.value || []);
      } else {
        setMarketReadiness([]);
      }

      if (recommendationResult.status === "fulfilled") {
        setRecommendations(recommendationResult.value || []);
      } else {
        setRecommendations([]);
      }

      if (metricsResult.status === "fulfilled") {
        setTrendData(metricsResult.value?.carbonTrendData || []);
        setEmissionBreakdown(metricsResult.value?.emissionBreakdown || []);
      } else {
        setTrendData([]);
        setEmissionBreakdown([]);
      }

      setInsightsLoading(false);
    };

    fetchOverviewData();

    return () => {
      cancelled = true;
    };
  }, [user?.company_id]);

  const chartTrendData = trendData.length > 0 ? trendData : localFallbackTrendData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.totalCO2")}</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.totalCO2.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("stats.kgCO2eThisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.skuTracking")}</CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.skuCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("stats.activeProducts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.exportReadiness")}</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              {stats.exportReadiness}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.exportReadiness} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.dataReliability")}</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent">
              {stats.confidenceScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="w-4 h-4" />
              <span>{t("stats.basedOnSKUs", { count: stats.skuCount })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts
        carbonTrendData={chartTrendData}
        emissionBreakdown={emissionBreakdown}
        isLoading={insightsLoading}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t("marketReadiness.title")}
            </CardTitle>
            <CardDescription>{t("marketReadiness.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insightsLoading ? (
              <div className="h-28 bg-muted animate-pulse rounded-md" />
            ) : marketReadiness.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No market readiness data yet.
              </p>
            ) : (
              marketReadiness.map((market) => (
                <div key={market.market} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{market.market}</span>
                      <Badge
                        className={getReadinessColor(market.score)}
                        variant="secondary"
                      >
                        {market.score >= 75 ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {market.score}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={market.score} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("recommendations.title")}
            </CardTitle>
            <CardDescription>{t("recommendations.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insightsLoading ? (
              <div className="h-28 bg-muted animate-pulse rounded-md" />
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recommendations available.
              </p>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <Badge
                      className={getImpactColor(rec.impact)}
                      variant="secondary"
                    >
                      -{rec.reduction}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rec.description}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => navigate.push("/products")}
        >
          <CardHeader>
            <PlusCircle className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.addProduct.title")}
            </CardTitle>
            <CardDescription>
              {t("quickActions.addProduct.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => navigate.push("/logistics")}
        >
          <CardHeader>
            <Truck className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.trackShipment.title")}
            </CardTitle>
            <CardDescription>
              {t("quickActions.trackShipment.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => navigate.push("/reports")}
        >
          <CardHeader>
            <FileCheck className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">
              {t("quickActions.generateReport.title")}
            </CardTitle>
            <CardDescription>
              {t("quickActions.generateReport.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t("quickActions.getStarted")}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {pendingProductData && (
        <ProductOverviewModal
          open={showProductModal}
          onClose={handleCloseModal}
          productData={pendingProductData}
        />
      )}
    </div>
  );
};

export default OverviewPage;
