/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/ProductContext";
import { createClient } from "@/lib/supabase/client";
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
import { useIsDemo } from "@/hooks/useTenantData";
import {
  marketReadiness,
  recommendations,
  getReadinessColor,
  getImpactColor,
} from "@/lib/dashboardData";
import { useTranslations } from "next-intl";
import ProductOverviewModal from "../assessment/ProductOverviewModal";
import OverviewCharts from "../OverviewCharts";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";

interface Company {
  target_markets: string[] | null;
  name?: string;
}

// Mock company data for demo users
const MOCK_DEMO_COMPANY: Company = {
  name: "WeaveCarbon Demo Company",
  target_markets: ["US", "EU", "JP"],
};

const OverviewPage: React.FC = () => {
  const t = useTranslations("overview");
  const { user } = useAuth();
  const { products, pendingProductData, clearPendingProduct } = useProducts();
  const navigate = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const isDemo = useIsDemo();
  const [showProductModal, setShowProductModal] = useState(false);
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle(t("pageTitle"), t("pageSubtitle"));
  }, [setPageTitle, t]);

  // Show modal when there's pending product data from assessment
  useEffect(() => {
    if (pendingProductData) {
      setShowProductModal(true);
    }
  }, [pendingProductData]);

  const handleCloseModal = () => {
    setShowProductModal(false);
    clearPendingProduct();
  };

  // Calculate dashboard stats dynamically from products
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

    // Export readiness based on published ratio and average confidence
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

  // Load company data - use mock data for demo users, fetch from DB for real users
  useEffect(() => {
    if (isDemo || user?.is_demo_user) {
      // Use mock company data for demo users
      console.log("[OverviewPage] Using mock company data for demo user");
      setCompany(MOCK_DEMO_COMPANY);
    } else {
      // Fetch real company data from database
      const fetchCompany = async () => {
        const companyId = user?.company_id;
        if (!companyId) {
          console.log("[OverviewPage] No companyId found");
          return;
        }

        console.log("[OverviewPage] Fetching company data for:", companyId);
        const supabase = createClient();
        const { data: companyData, error } = await supabase
          .from("companies")
          .select("target_markets, name")
          .eq("id", companyId)
          .maybeSingle();

        if (error) {
          console.error("[OverviewPage] Error fetching company:", error);
          return;
        }

        if (companyData) {
          console.log("[OverviewPage] Company data loaded:", companyData.name);
          setCompany(companyData);
        }
      };
      fetchCompany();
    }
  }, [user?.company_id, user?.is_demo_user, isDemo]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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
            <CardTitle className="text-3xl font-bold">
              {stats.skuCount}
            </CardTitle>
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
              <span>{t("stats.basedOnSKUs")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <OverviewCharts />

      {/* Export Readiness & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Export Readiness by Market */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t("marketReadiness.title")}
            </CardTitle>
            <CardDescription>{t("marketReadiness.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketReadiness.map((market) => (
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
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("recommendations.title")}
            </CardTitle>
            <CardDescription>{t("recommendations.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => navigate.push("/dashboard/products")}
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
          onClick={() => navigate.push("/dashboard/logistics")}
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
          onClick={() => navigate.push("/dashboard/reports")}
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

      {/* Target Markets
      {company?.target_markets && company.target_markets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.targetMarkets")}</CardTitle>
            <CardDescription>
              {t("dashboard.targetMarketsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {company.target_markets.map((market) => (
                <Badge key={market} variant="secondary" className="text-sm">
                  {market}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Product Overview Modal - shown after product creation */}
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
