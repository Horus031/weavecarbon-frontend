// Section B - Total Carbon Footprint Card
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
            Total Carbon Footprint
          </div>
          {isPreliminary && (
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-400 bg-yellow-50"
            >
              <Clock className="w-3 h-3 mr-1" />
              Preliminary
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preliminary Notice */}
        {isPreliminary && (
          <div className="text-xs text-yellow-700 bg-yellow-100 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Đây là kết quả ước tính sơ bộ. Cập nhật dữ liệu để có kết quả
              chính xác hơn.
            </span>
          </div>
        )}

        {/* Main CO2 Value */}
        <div className="text-center py-4">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {isPreliminary ? "Ước tính sơ bộ" : "Tổng phát thải"}
          </div>
          <div
            className={`text-5xl font-bold mb-1 ${isPreliminary ? "text-yellow-600" : "text-primary"}`}
          >
            {carbonDetail.totalCo2e.toFixed(2)}
          </div>
          <div className="text-lg text-muted-foreground">
            kg CO₂e / sản phẩm
          </div>

          {/* Range if proxy data */}
          {hasRange && carbonDetail.co2eRange && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">Khoảng ước tính: </span>
              {carbonDetail.co2eRange.min.toFixed(1)} –{" "}
              {carbonDetail.co2eRange.max.toFixed(1)} kg CO₂e
            </div>
          )}
        </div>

        {/* Confidence Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Độ tin cậy dữ liệu</span>
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
            {carbonDetail.confidenceLevel === "high" &&
              "Dữ liệu từ nguồn chính thức, đã xác minh"}
            {carbonDetail.confidenceLevel === "medium" &&
              "Một số dữ liệu sử dụng proxy factors"}
            {carbonDetail.confidenceLevel === "low" &&
              "Phần lớn dữ liệu là ước tính, cần bổ sung thêm"}
          </p>
        </div>

        {/* Methodology Note */}
        <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Tính toán theo phương pháp LCA (Life Cycle Assessment), tuân thủ ISO
            14067 và GHG Protocol.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonFootprintCard;
