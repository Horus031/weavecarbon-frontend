"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useDashboardTitle } from "@/contexts/DashboardContext";
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
import { getReadinessColor, getImpactColor } from "@/lib/dashboardData";
import OverviewCharts from "@/components/dashboard/OverviewCharts";

interface Company {
  target_markets: string[] | null;
}

interface Stats {
  totalCO2: number;
  skuCount: number;
  exportReadiness: number;
  confidenceScore: number;
}

interface MarketReadiness {
  market: string;
  score: number;
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: string;
  reduction: string;
}

interface OverviewPageClientProps {
  company: Company;
  stats: Stats;
  marketReadiness: MarketReadiness[];
  recommendations: Recommendation[];
}

export default function OverviewPageClient({
  company,
  stats,
  marketReadiness,
  recommendations,
}: OverviewPageClientProps) {
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Overview", "Overview of your carbon tracking");
  }, [setPageTitle]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="h-full">
          <CardHeader className="pb-2 pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">
              Total CO₂ Emissions
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl font-bold mt-1">
              {stats.totalCO2.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4">
            <p className="text-xs md:text-sm text-muted-foreground">
              kg CO₂e this month
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2 pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">
              SKUs Tracking
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl font-bold mt-1">
              {stats.skuCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4">
            <p className="text-xs md:text-sm text-muted-foreground">
              active products
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2 pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">
              Export Readiness
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary mt-1">
              {stats.exportReadiness}%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4">
            <Progress value={stats.exportReadiness} className="h-2" />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2 pt-4 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">
              Data Reliability
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl font-bold text-accent mt-1">
              {stats.confidenceScore}%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Gauge className="w-3 h-3 md:w-4 md:h-4" />
              <span className="truncate">Based on {stats.skuCount} SKUs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row (client component) */}
      <OverviewCharts />

      {/* Export Readiness & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Export Readiness Level
            </CardTitle>
            <CardDescription>Assessment by Target Market</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-base">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5" />
              <span className="truncate">Recommendations</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              AI-powered suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="hover:border-primary/50 transition-colors flex flex-col">
          <Link href="/products" className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <PlusCircle className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <CardTitle className="text-base md:text-lg">
                Add New Product
              </CardTitle>
              <CardDescription className="text-xs md:text-sm line-clamp-2">
                Create a product and calculate carbon footprint
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs md:text-sm"
              >
                Get Started <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors flex flex-col">
          <Link href="/logistics" className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <Truck className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <CardTitle className="text-base md:text-lg">
                Track Shipment
              </CardTitle>
              <CardDescription className="text-xs md:text-sm line-clamp-2">
                Monitor shipping emissions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs md:text-sm"
              >
                Get Started <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors flex flex-col sm:col-span-2 lg:col-span-1">
          <Link href="/reports" className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <FileCheck className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
              <CardTitle className="text-base md:text-lg">
                Generate Report
              </CardTitle>
              <CardDescription className="text-xs md:text-sm line-clamp-2">
                Create compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs md:text-sm"
              >
                Get Started <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Target Markets */}
      {company?.target_markets && company.target_markets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-base">
              Target Markets
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Your selected export destinations
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
      )}
    </div>
  );
}
