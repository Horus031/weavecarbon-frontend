"use client";

import React, { useState, useMemo } from "react";
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
import { generateDemoComplianceData } from "./complianceDemoData";
import ComplianceDetailModal from "./ComplianceDetailModal";

const ExportPage: React.FC = () => {
  const t = useTranslations("export");
  const [selectedMarket, setSelectedMarket] = useState<MarketCode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 50)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
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

  // Get compliance data from demo generator
  const complianceData = useMemo(() => generateDemoComplianceData(), []);
  const markets: MarketCode[] = ["EU", "US", "JP", "KR"];

  const documents = [
    { name: "GOTS Certificate", status: "valid", expires: "2024-12-31" },
    { name: "OEKO-TEX Standard 100", status: "valid", expires: "2024-08-15" },
    { name: "Carbon Footprint Report", status: "pending", expires: null },
    { name: "EU Product Passport", status: "draft", expires: null },
  ];

  const handleOpenMarketDetail = (market: MarketCode) => {
    setSelectedMarket(market);
    setIsDetailOpen(true);
  };

  // Calculate summary stats
  const validCerts = documents.filter((d) => d.status === "valid").length;
  const pendingCerts = documents.filter((d) => d.status === "pending").length;
  const readyMarkets = markets.filter(
    (m) => complianceData[m].score >= 80,
  ).length;
  const needsWorkMarkets = markets.filter(
    (m) => complianceData[m].score < 80,
  ).length;

  return (
    <>
      <div className="space-y-4 md:space-y-6 no-horizontal-scroll">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg md:text-xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {t("subtitle")}
          </p>
        </div>

        {/* Market Readiness - Card list on mobile */}
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("marketReadiness")}
          </h3>
          <div className="grid gap-3">
            {markets.map((market) => {
              const data = complianceData[market];
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
          <div className="grid gap-3">
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

        {/* Quick Stats Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {validCerts}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("validCerts")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {pendingCerts}
                </p>
                <p className="text-xs text-muted-foreground">{t("pending")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {readyMarkets}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("readyMarkets")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {needsWorkMarkets}
                </p>
                <p className="text-xs text-muted-foreground">{t("needsSupport")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Detail Modal */}
      <ComplianceDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        marketCode={selectedMarket}
      />
    </>
  );
};

export default ExportPage;
