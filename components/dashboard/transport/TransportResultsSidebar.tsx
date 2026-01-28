"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, CheckCircle2, Ship, Plane, Truck } from "lucide-react";
import { LegInput } from "./TransportClient";

interface TransportResultsSidebarProps {
  legs: LegInput[];
  totalDistance: number;
  totalCO2: number;
  hasLocationPermission: boolean;
  calculateLegCO2: (leg: LegInput) => number;
  onSubmit: () => void;
}

const TransportResultsSidebar: React.FC<TransportResultsSidebarProps> = ({
  legs,
  totalDistance,
  totalCO2,
  hasLocationPermission,
  calculateLegCO2,
  onSubmit,
}) => {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "ship":
        return <Ship className="w-4 h-4" />;
      case "air":
        return <Plane className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Kết quả tạm tính
        </CardTitle>
        <CardDescription>Cập nhật theo thời gian thực</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng quãng đường</span>
            <span className="font-bold">{totalDistance.toLocaleString()} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Số chặng</span>
            <span className="font-medium">{legs.length}</span>
          </div>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">CO₂ ước tính</span>
            <Badge variant="secondary">
              {hasLocationPermission ? "High confidence" : "Estimate"}
            </Badge>
          </div>
          <p className="text-3xl font-bold text-primary">
            {totalCO2.toFixed(2)}
            <span className="text-lg font-normal ml-1">kg CO₂e</span>
          </p>
        </div>

        {/* Breakdown */}
        {legs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Chi tiết theo chặng:</p>
            {legs.map((leg, index) => (
              <div
                key={leg.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  {getModeIcon(leg.mode)}
                  Chặng {index + 1}
                </span>
                <span>{calculateLegCO2(leg).toFixed(2)} kg</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            className="w-full"
            size="lg"
            onClick={onSubmit}
            disabled={totalDistance === 0}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Lưu & Xem lịch sử
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Carbon được tính dựa trên hệ số DEFRA/GHG Protocol
        </p>
      </CardContent>
    </Card>
  );
};

export default TransportResultsSidebar;
