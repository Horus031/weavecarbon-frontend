/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Section C - Carbon Breakdown by Stage
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { CarbonBreakdownItem } from "@/lib/carbonDetailData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CarbonBreakdownChartProps {
  breakdown: CarbonBreakdownItem[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"];

const CarbonBreakdownChart: React.FC<CarbonBreakdownChartProps> = ({
  breakdown,
}) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Filter items with data for the chart
  const chartData = breakdown
    .filter((item) => item.hasData && item.percentage !== null)
    .map((item, index) => ({
      name: item.label,
      value: item.percentage || 0,
      co2e: item.co2e || 0,
      fill: COLORS[index % COLORS.length],
    }));

  const hasAwaitingData = breakdown.some((item) => !item.hasData);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value}% ({data.co2e.toFixed(2)} kg CO₂e)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Phân tích phát thải theo giai đoạn
          </CardTitle>
          {hasAwaitingData && (
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-400"
            >
              <Clock className="w-3 h-3 mr-1" />
              Đang chờ dữ liệu
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="h-70">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Đang chờ dữ liệu...</p>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            {breakdown.map((item, index) => (
              <Collapsible
                key={item.stage}
                open={expandedStage === item.stage}
                onOpenChange={() =>
                  setExpandedStage(
                    expandedStage === item.stage ? null : item.stage,
                  )
                }
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${item.hasData ? "bg-muted/50 hover:bg-muted" : "bg-yellow-50 border border-dashed border-yellow-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${!item.hasData ? "bg-gray-300" : ""}`}
                        style={{
                          backgroundColor: item.hasData
                            ? COLORS[index % COLORS.length]
                            : undefined,
                        }}
                      />
                      <span
                        className={`font-medium ${!item.hasData ? "text-muted-foreground" : ""}`}
                      >
                        {item.label}
                      </span>
                      {!item.hasData && (
                        <Badge
                          variant="outline"
                          className="text-xs text-yellow-600 border-yellow-400"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Awaiting data
                        </Badge>
                      )}
                      {item.hasData && item.isProxy && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Proxy
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.hasData ? (
                        <div className="text-right">
                          <span className="font-bold">{item.percentage}%</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({item.co2e?.toFixed(2)} kg)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-yellow-600">—</span>
                      )}
                      {expandedStage === item.stage ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div
                    className={`px-3 py-2 text-sm rounded-b-lg -mt-1 ${item.hasData ? "text-muted-foreground bg-muted/30" : "text-yellow-700 bg-yellow-50"}`}
                  >
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Ghi chú:</span> {item.note}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonBreakdownChart;
