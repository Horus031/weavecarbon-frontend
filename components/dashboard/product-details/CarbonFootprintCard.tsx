
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";
import { Leaf, Info, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { ProductCarbonDetail, CONFIDENCE_CONFIG } from "@/lib/carbonDetailData";

interface CarbonFootprintCardProps {
  carbonDetail: ProductCarbonDetail;
}

const CarbonFootprintCard: React.FC<CarbonFootprintCardProps> = ({
  carbonDetail
}) => {
  const t = useTranslations("productDetail.carbonFootprint");
  const confidenceConfig = CONFIDENCE_CONFIG[carbonDetail.confidenceLevel];
  const hasRange = carbonDetail.co2eRange !== undefined;
  const isPreliminary = carbonDetail.isPreliminary;

  return (
    <Card
      className={`border shadow-sm ${isPreliminary ? "border-amber-200 bg-amber-50/20" : "border-slate-200 bg-white"}`}>

      <CardHeader className="border-b border-slate-200 bg-slate-50/70 pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            {t("title")}
          </div>
          {isPreliminary &&
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700">

              <Clock className="w-3 h-3 mr-1" />
              {t("preliminary")}
            </Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {isPreliminary &&
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{t("preliminaryNotice")}</span>
          </div>
        }

        
        <div className="text-center py-4">
          <div className="text-xs text-slate-600 mb-1 uppercase tracking-wide">
            {isPreliminary ? t("preliminaryEstimate") : t("totalEmissions")}
          </div>
          <div
            className={`text-5xl font-bold mb-1 ${isPreliminary ? "text-amber-600" : "text-emerald-700"}`}>

            {carbonDetail.totalCo2e.toFixed(2)}
          </div>
          <div className="text-lg text-slate-600">
            {t("perProduct")}
          </div>

          
          {hasRange && carbonDetail.co2eRange &&
          <div className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{t("estimatedRange")}</span>
              {carbonDetail.co2eRange.min.toFixed(1)} –{" "}
              {carbonDetail.co2eRange.max.toFixed(1)} kg CO₂e
            </div>
          }
        </div>

        
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("confidenceLabel")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${confidenceConfig.bg} ${confidenceConfig.color}`}>
                      
                      {carbonDetail.confidenceLevel === "high" &&
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      }
                      {carbonDetail.confidenceLevel === "medium" &&
                      <Info className="w-3 h-3 mr-1" />
                      }
                      {carbonDetail.confidenceLevel === "low" &&
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      }
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

          <p className="text-xs text-slate-600">
            {carbonDetail.confidenceLevel === "high" && t("highConfidence")}
            {carbonDetail.confidenceLevel === "medium" && t("mediumConfidence")}
            {carbonDetail.confidenceLevel === "low" && t("lowConfidence")}
          </p>
        </div>

        
        <div className="flex items-start gap-2 pt-2 text-xs text-slate-600">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{t("methodologyNote")}</span>
        </div>
      </CardContent>
    </Card>);

};

export default CarbonFootprintCard;