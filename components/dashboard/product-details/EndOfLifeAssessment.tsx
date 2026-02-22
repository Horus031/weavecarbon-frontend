
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Recycle,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle } from
"lucide-react";
import { EndOfLifeData } from "@/lib/carbonDetailData";

interface EndOfLifeAssessmentProps {
  endOfLife: EndOfLifeData;
}

const STRATEGY_CONFIG = {
  no_takeback: { color: "bg-red-100 text-red-700", icon: Trash2 },
  selective: { color: "bg-yellow-100 text-yellow-700", icon: RefreshCw },
  data_based: { color: "bg-green-100 text-green-700", icon: Recycle },
  not_set: { color: "bg-gray-100 text-gray-600", icon: Clock }
};

const EndOfLifeAssessment: React.FC<EndOfLifeAssessmentProps> = ({
  endOfLife
}) => {
  const strategyConfig = STRATEGY_CONFIG[endOfLife.strategy];
  const StrategyIcon = strategyConfig.icon;
  const hasData = endOfLife.hasData;

  const breakdownItems = [
  {
    label: "Tái sử dụng (Reuse)",
    value: endOfLife.breakdown.reuse,
    color: "bg-green-500"
  },
  {
    label: "Tái chế (Recycle)",
    value: endOfLife.breakdown.recycle,
    color: "bg-blue-500"
  },
  {
    label: "Thải bỏ (Disposal)",
    value: endOfLife.breakdown.disposal,
    color: "bg-gray-400"
  }];


  return (
    <Card className={!hasData ? "border-dashed border-yellow-300" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Recycle className="w-5 h-5 text-primary" />
            Đánh giá cuối vòng đời
          </CardTitle>
          {!hasData &&
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-400">
            
              <AlertCircle className="w-3 h-3 mr-1" />
              Cần bổ sung
            </Badge>
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {!hasData &&
        <div className="text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Chưa thiết lập chiến lược cuối vòng đời
              </p>
              <p className="text-xs mt-1">
                Vui lòng chọn chiến lược để hoàn thiện đánh giá carbon
                footprint.
              </p>
            </div>
          </div>
        }

        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Chiến lược End-of-life:</span>
          <Badge className={strategyConfig.color}>
            <StrategyIcon className="w-3 h-3 mr-1" />
            {endOfLife.strategyLabel}
          </Badge>
        </div>

        
        {hasData &&
        <div className="space-y-3">
            <p className="text-sm font-medium">Phân bổ dự kiến:</p>
            {breakdownItems.map((item) =>
          <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
          )}
          </div>
        }

        
        {hasData &&
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-3 rounded-lg bg-green-50">
              <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Avoided emissions</span>
              </div>
              <p className="text-xl font-bold text-green-700">
                {endOfLife.avoidedEmissions.toFixed(2)} kg CO₂e
              </p>
            </div>
            <div
            className={`text-center p-3 rounded-lg ${endOfLife.netImpact >= 0 ? "bg-red-50" : "bg-green-50"}`}>
            
              <div
              className={`flex items-center justify-center gap-1 mb-1 ${endOfLife.netImpact >= 0 ? "text-red-700" : "text-green-700"}`}>
              
                {endOfLife.netImpact >= 0 ?
              <TrendingUp className="w-4 h-4" /> :

              <TrendingDown className="w-4 h-4" />
              }
                <span className="text-sm font-medium">Net impact</span>
              </div>
              <p
              className={`text-xl font-bold ${endOfLife.netImpact >= 0 ? "text-red-700" : "text-green-700"}`}>
              
                {endOfLife.netImpact >= 0 ? "+" : ""}
                {endOfLife.netImpact.toFixed(2)} kg CO₂e
              </p>
            </div>
          </div>
        }

        
        {!hasData &&
        <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Đang chờ dữ liệu...</p>
          </div>
        }
      </CardContent>
    </Card>);

};

export default EndOfLifeAssessment;