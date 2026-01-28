"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Leaf, Factory, Truck } from "lucide-react";

interface HistorySummaryStatsProps {
  history: Array<{
    materialsCO2: number;
    manufacturingCO2: number;
    transportCO2: number;
  }>;
}

const HistorySummaryStats: React.FC<HistorySummaryStatsProps> = ({
  history,
}) => {
  const totalMaterials = history.reduce((sum, h) => sum + h.materialsCO2, 0);
  const totalManufacturing = history.reduce(
    (sum, h) => sum + h.manufacturingCO2,
    0
  );
  const totalTransport = history.reduce((sum, h) => sum + h.transportCO2, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-sm text-muted-foreground">Tổng bản ghi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMaterials.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                Vật liệu (kg CO₂)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalManufacturing.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                Sản xuất (kg CO₂)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTransport.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                Vận chuyển (kg CO₂)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorySummaryStats;
