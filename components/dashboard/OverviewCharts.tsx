"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
"@/components/ui/card";
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
  Tooltip } from
"recharts";
import { useTranslations } from "next-intl";

export interface TrendDataPoint {
  month: string;
  emissions: number;
  target: number;
}

export interface EmissionBreakdownPoint {
  name: string;
  value: number;
  color: string;
}

interface OverviewChartsProps {
  carbonTrendData?: TrendDataPoint[];
  emissionBreakdown?: EmissionBreakdownPoint[];
  isLoading?: boolean;
}

export default function OverviewCharts({
  carbonTrendData = [],
  emissionBreakdown = [],
  isLoading = false
}: OverviewChartsProps) {
  const t = useTranslations("overview");

  const hasTrendData = carbonTrendData.length > 0;
  const hasBreakdownData = emissionBreakdown.length > 0;

  const getLabel = (label: string) => {
    if (!label.includes(".")) return label;
    try {
      return t(label);
    } catch {
      return label;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
      <Card className="lg:col-span-2 overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="truncate">{t("chart.carbon.title")}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-700 md:text-sm">
            {t("chart.carbon.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white pt-5">
          <div className="h-48 md:h-64">
            {isLoading ?
            <div className="h-full w-full rounded-md border border-slate-300 bg-slate-200/70 animate-pulse" /> :
            hasTrendData ?
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonTrendData}>
                  <defs>
                    <linearGradient
                    id="colorEmissions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">

                      <stop
                      offset="5%"
                      stopColor="hsl(150 60% 20%)"
                      stopOpacity={0.3} />

                      <stop
                      offset="95%"
                      stopColor="hsl(150 60% 20%)"
                      stopOpacity={0} />

                    </linearGradient>
                  </defs>
                  <XAxis
                  dataKey="month"
                  stroke="hsl(150 12% 35%)"
                  fontSize={12} />

                  <YAxis stroke="hsl(150 12% 35%)" fontSize={12} />
                  <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(215 16% 78%)",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }} />

                  <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke="hsl(150 60% 20%)"
                  strokeWidth={2}
                  fill="url(#colorEmissions)"
                  name={t("chart.carbon.outcome")} />

                  <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(150 60% 20%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                  name={t("chart.carbon.expect")} />

                </AreaChart>
              </ResponsiveContainer> :

            <div className="flex h-full items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-sm text-slate-700">
                No chart data yet
              </div>
            }
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="truncate">{t("chart.pie.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-5">
          <div className="h-48 md:h-48 flex items-center justify-center">
            {isLoading ?
            <div className="h-full w-full rounded-md border border-slate-300 bg-slate-200/70 animate-pulse" /> :
            hasBreakdownData ?
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                  data={emissionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value">

                    {emissionBreakdown.map((entry, index) =>
                  <Cell key={`cell-${index}`} fill={entry.color} />
                  )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer> :

            <div className="flex h-full w-full items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-sm text-slate-700">
                No breakdown data yet
              </div>
            }
          </div>

          {hasBreakdownData &&
          <div className="grid grid-cols-2 gap-2 mt-4">
              {emissionBreakdown.map((item) =>
            <div
              key={item.name}
              className="flex items-center gap-2 text-xs md:text-sm">

                  <div
                className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }} />

                  <span className="truncate text-slate-700">
                    {getLabel(item.name)}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-slate-900 md:text-sm">
                    {item.value}%
                  </span>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}
