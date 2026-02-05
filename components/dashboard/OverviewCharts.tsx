"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { carbonTrendData, emissionBreakdown } from "@/lib/dashboardData";
import { useTranslations } from "next-intl";

export default function OverviewCharts() {
  const t = useTranslations("overview");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="truncate">{t("chart.carbon.title")}</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t("chart.carbon.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonTrendData}>
                <defs>
                  <linearGradient
                    id="colorEmissions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(150 60% 20%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(150 60% 20%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="hsl(150 10% 45%)"
                  fontSize={12}
                />
                <YAxis stroke="hsl(150 10% 45%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(140 20% 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke="hsl(150 60% 20%)"
                  strokeWidth={2}
                  fill="url(#colorEmissions)"
                  name={t("chart.carbon.outcome")}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(150 60% 20%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                  name={t("chart.carbon.expect")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="truncate">{t("chart.pie.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 md:h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emissionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {emissionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {emissionBreakdown.map((item) => (
              <div
                key={t(item.name)}
                className="flex items-center gap-2 text-xs md:text-sm"
              >
                <div
                  className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground truncate">
                  {t(item.name)}
                </span>
                <span className="font-medium ml-auto text-xs md:text-sm">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
