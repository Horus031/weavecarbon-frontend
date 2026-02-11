"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Globe,
  FileDown,
  Shield,
  BookOpen,
  Package,
  Leaf,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Info,
} from "lucide-react";
import { MarketCode, MarketCompliance, STATUS_CONFIG, MARKET_REGULATIONS } from "./types";
import ComplianceRecommendations from "./ComplianceRecommendations";
import ComplianceDocuments from "./ComplianceDocuments";
import ComplianceCarbonData from "./ComplianceCarbonData";
import ComplianceProductScope from "./ComplianceProductScope";

interface ComplianceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketCode: MarketCode | null;
  complianceData?: Record<MarketCode, MarketCompliance> | null;
}

const ComplianceDetailModal: React.FC<ComplianceDetailModalProps> = ({
  open,
  onOpenChange,
  marketCode,
}) => {
  const t = useTranslations("export.modal");
  const [activeTab, setActiveTab] = useState("overview");

  const compliance =
    marketCode && complianceData ? complianceData[marketCode] : null;

  if (!compliance || !marketCode) return null;

  const statusConfig = STATUS_CONFIG[compliance.status];
  const regulation = MARKET_REGULATIONS[marketCode];

  const handleRecommendationAction = (action: string, recId: string) => {
    toast.info(`Action: ${action} cho recommendation ${recId}`);
  };

  const handleDocumentAction = (action: string) => (docId: string) => {
    toast.info(`${action} document: ${docId}`);
  };

  const handleCarbonDataEdit = (scope: string) => {
    toast.info(`Edit carbon data: ${scope}`);
  };

  const handleProductAction = (action: string) => (productId?: string) => {
    toast.info(`${action} product: ${productId || "new"}`);
  };

  const handleExportReport = () => {
    if (compliance.status !== "ready" && compliance.status !== "verified") {
      toast.error(t("notReadyError"));
      return;
    }
    toast.success(t("generatingReport"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-[100vw] max-h-dvh md:max-w-5xl md:max-h-[90vh] p-0 gap-0 rounded-none md:rounded-lg">
        {/* Header */}
        <DialogHeader className="p-4 md:p-6 pb-3 md:pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {marketCode}
                </span>
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl">
                  {t("market")} {compliance.marketName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {regulation.name} ({regulation.code})
                </p>
              </div>
            </div>
            <Badge
              className={`${statusConfig.bgColor} ${statusConfig.color} shrink-0 w-fit`}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Score Summary */}
          <div className="mt-3 md:mt-4 p-3 md:p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t("readinessLevel")}
              </span>
              <span className="text-xl md:text-2xl font-bold text-primary">
                {compliance.score}%
              </span>
            </div>
            <Progress value={compliance.score} className="h-3" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-2 text-xs text-muted-foreground">
              <span>
                {t("updated")}{" "}
                {new Date(compliance.lastUpdated).toLocaleDateString()}
              </span>
              <span>
                {compliance.score >= 80 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" /> {t("exportReady")}
                  </span>
                ) : compliance.score >= 50 ? (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="w-3 h-3" /> {t("needsWork")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" /> {t("notReady")}
                  </span>
                )}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="md:mx-8 mt-3 md:mt-4 w-96 md:w-fit flex flex-nowrap mx-auto ">
            <TabsTrigger value="overview" className="gap-1.5">
              <Globe className="w-4 h-4 hidden md:static" />
              {t("overviewTab")}
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="w-4 h-4 hidden md:static" />
              {t("productsTab")}
            </TabsTrigger>
            <TabsTrigger value="carbon" className="gap-1.5">
              <Leaf className="w-4 h-4 hidden md:static" />
              {t("carbonTab")}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FileText className="w-4 h-4 hidden md:static" />
              {t("documentsTab")}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4 md:p-6 pt-3 md:pt-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Recommendations */}
              <ComplianceRecommendations
                recommendations={compliance.recommendations}
                onAction={handleRecommendationAction}
              />

              {/* Regulation Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">
                        {t("regulationInfo")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            {t("regulationCode")}{" "}
                          </span>
                          <span className="font-medium">{regulation.code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {t("reference")}{" "}
                          </span>
                          <span className="font-medium">
                            {regulation.legalReference}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {t("scope")}{" "}
                          </span>
                          <span className="font-medium">
                            {regulation.reportingScope}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {t("reportingFrequency")}{" "}
                          </span>
                          <span className="font-medium">
                            {regulation.reportingFrequency}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            {t("enforcementDate")}{" "}
                          </span>
                          <span className="font-medium">
                            {regulation.enforcementDate}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        {regulation.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              {compliance.verificationRequired && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">
                            {t("verificationStatus")}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {t("verificationRequired")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          compliance.verificationStatus === "verified"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {compliance.verificationStatus === "verified"
                          ? t("verified")
                          : compliance.verificationStatus === "pending"
                            ? t("verificationPending")
                            : t("rejected")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-0">
              <ComplianceProductScope
                products={compliance.productScope}
                marketName={compliance.marketName}
                onAddProduct={handleProductAction("add")}
                onEditProduct={handleProductAction("edit")}
                onRemoveProduct={handleProductAction("remove")}
              />
            </TabsContent>

            <TabsContent value="carbon" className="mt-0">
              <ComplianceCarbonData
                carbonData={compliance.carbonData}
                emissionFactors={compliance.emissionFactors}
                onEditData={handleCarbonDataEdit}
                onAddData={() => toast.info("Add carbon data")}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <ComplianceDocuments
                documents={compliance.documents}
                onUpload={handleDocumentAction("upload")}
                onDownload={handleDocumentAction("download")}
                onRemove={handleDocumentAction("remove")}
                onView={handleDocumentAction("view")}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 pt-3 md:pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("viewGuide")}
            </Button>
            <Button
              onClick={handleExportReport}
              disabled={
                compliance.status !== "ready" &&
                compliance.status !== "verified"
              }
              className="w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {t("exportReport")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceDetailModal;
