"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import {
  Globe,
  FileText,
  FileCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { MarketCode } from "./types";
import ComplianceDetailModal from "./ComplianceDetailModal";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const ExportPage: React.FC = () => {
  const t = useTranslations("export");
  const [selectedMarket, setSelectedMarket] = useState<MarketCode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {t("status.valid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {t("status.pending")}
          </Badge>
        );
      case "draft":
        return <Badge variant="secondary">{t("status.draft")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

const getReadinessColor = (score: number): string => {
  if (score >= 80)
    return "bg-green-50 text-green-700 border border-green-200";
  if (score >= 50)
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  return "bg-red-50 text-red-700 border border-red-200";
};

  const getMarketRegulation = (code: MarketCode) => {
    switch (code) {
      case "EU":
        return "CBAM, EU Green Deal";
      case "US":
        return "California Climate";
      case "JP":
        return "JIS Standards";
      case "KR":
        return "K-ETS";
      default:
        return "";
    }
  };

  const complianceData = null;
  const markets: MarketCode[] = complianceData ? ["EU", "US", "JP", "KR"] : [];

  const documents = complianceData
    ? [
        { name: "GOTS Certificate", status: "valid", expires: "2024-12-31" },
        { name: "OEKO-TEX Standard 100", status: "valid", expires: "2024-08-15" },
        { name: "Carbon Footprint Report", status: "pending", expires: null },
        { name: "EU Product Passport", status: "draft", expires: null },
      ]
    : [];

  const handleOpenMarketDetail = (market: MarketCode) => {
    setSelectedMarket(market);
    setIsDetailOpen(true);
  };

  // Calculate summary stats
  const validCerts = documents.filter((d) => d.status === "valid").length;
  const pendingCerts = documents.filter((d) => d.status === "pending").length;
  const readyMarkets = complianceData
    ? markets.filter((m) => complianceData[m].score >= 80).length
    : 0;
  const needsWorkMarkets = complianceData
    ? markets.filter((m) => complianceData[m].score < 80).length
    : 0;

  return (
    <>
      <div className="space-y-4 md:space-y-6 no-horizontal-scroll">
        {/* Market Readiness - Card list on mobile */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t("marketReadiness")}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-green-50 text-green-700 border-green-200">
                <span className="font-semibold">
                  {validCerts}
                </span>
                <span className="font-semibold">
                  {t("validCerts")}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                <span className="font-semibold">
                  {pendingCerts}
                </span>
                <span className="font-semibold">
                  {t("pending")}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-primary/10 text-primary border-primary/20">
                <span className="font-semibold">
                  {readyMarkets}
                </span>
                <span className="font-semibold">
                  {t("readyMarkets")}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-red-50 text-red-700 border-red-200">
                <span className="font-semibold">
                  {needsWorkMarkets}
                </span>
                <span className="font-semibold">
                  {t("needsSupport")}
                </span>
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {markets.map((market) => {
              const data = complianceData?.[market];
              if (!data) return null;
              return (
                <Card
                  key={market}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenMarketDetail(market)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Market code badge */}
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {market}
                        </span>
                      </div>

                      {/* Market info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {t("market")} {data.marketName}
                          </p>
                          <Badge className={getReadinessColor(data.score)}>
                            {data.score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          {getMarketRegulation(market)}
                        </p>
                        <Progress value={data.score} className="h-2" />
                      </div>
                    </div>

                    {/* Status indicators on mobile */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs">
                        {data.score >= 80 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">
                              {t("exportReady")}
                            </span>
                          </>
                        ) : data.score >= 50 ? (
                          <>
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {
                                data.recommendations.filter(
                                  (r) => r.status === "active",
                                ).length
                              }{" "}
                              {t("needsWork")}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 dark:text-red-400">
                              {t("notReady")}
                            </span>
                          </>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        {t("details")}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Certificates & Documents */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("certificates")}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {documents.map((doc, i) => (
              <Card
                key={i}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {doc.name}
                        </p>
                        {doc.expires && (
                          <p className="text-xs text-muted-foreground">
                            {t("expires")} {doc.expires}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(doc.status)}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* Compliance Detail Modal */}
      <ComplianceDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        marketCode={selectedMarket}
        complianceData={complianceData}
      />
    </>
  );
};

export default ExportPage;
