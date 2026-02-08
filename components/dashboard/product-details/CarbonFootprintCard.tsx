// Section B - Total Carbon Footprint Card
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Leaf, Info, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { ProductCarbonDetail, CONFIDENCE_CONFIG } from "@/lib/carbonDetailData";

interface CarbonFootprintCardProps {
  carbonDetail: ProductCarbonDetail;
}

const CarbonFootprintCard: React.FC<CarbonFootprintCardProps> = ({
  carbonDetail,
}) => {
  const t = useTranslations("productDetail.carbonFootprint");
  const confidenceConfig = CONFIDENCE_CONFIG[carbonDetail.confidenceLevel];
  const hasRange = carbonDetail.co2eRange !== undefined;
  const isPreliminary = carbonDetail.isPreliminary;

  return (
    <Card
      className={`border-2 ${isPreliminary ? "border-yellow-300 bg-gradient-to-br from-yellow-50/50 to-transparent" : "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            {t("title")}
          </div>
          {isPreliminary && (
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-400 bg-yellow-50"
            >
              <Clock className="w-3 h-3 mr-1" />
              {t("preliminary")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preliminary Notice */}
        {isPreliminary && (
          <div className="text-xs text-yellow-700 bg-yellow-100 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{t("preliminaryNotice")}</span>
          </div>
        )}

        {/* Main CO2 Value */}
        <div className="text-center py-4">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {isPreliminary ? t("preliminaryEstimate") : t("totalEmissions")}
          </div>
          <div
            className={`text-5xl font-bold mb-1 ${isPreliminary ? "text-yellow-600" : "text-primary"}`}
          >
            {carbonDetail.totalCo2e.toFixed(2)}
          </div>
          <div className="text-lg text-muted-foreground">
            {t("perProduct")}
          </div>

          {/* Range if proxy data */}
          {hasRange && carbonDetail.co2eRange && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">{t("estimatedRange")}</span>
              {carbonDetail.co2eRange.min.toFixed(1)} –{" "}
              {carbonDetail.co2eRange.max.toFixed(1)} kg CO₂e
            </div>
          )}
        </div>

        {/* Confidence Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("confidenceLabel")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${confidenceConfig.bg} ${confidenceConfig.color}`}
                    >
                      {carbonDetail.confidenceLevel === "high" && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {carbonDetail.confidenceLevel === "medium" && (
                        <Info className="w-3 h-3 mr-1" />
                      )}
                      {carbonDetail.confidenceLevel === "low" && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {confidenceConfig.label} ({carbonDetail.confidenceScore}%)
                    </Badge>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{carbonDetail.calculationNote}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Progress value={carbonDetail.confidenceScore} className="h-2" />

          <p className="text-xs text-muted-foreground">
            {carbonDetail.confidenceLevel === "high" && t("highConfidence")}
            {carbonDetail.confidenceLevel === "medium" && t("mediumConfidence")}
            {carbonDetail.confidenceLevel === "low" && t("lowConfidence")}
          </p>
        </div>

        {/* Methodology Note */}
        <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{t("methodologyNote")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonFootprintCard;
