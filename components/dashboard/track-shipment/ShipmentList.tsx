"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, MapPin, CheckCircle2, Truck, Clock } from "lucide-react";
import { DEMO_SHIPMENTS } from "@/lib/trackShipmentData";

interface ShipmentListProps {
  shipments: typeof DEMO_SHIPMENTS;
  selectedShipment: (typeof DEMO_SHIPMENTS)[0] | null;
  onSelectShipment: (shipment: (typeof DEMO_SHIPMENTS)[0]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({
  shipments,
  selectedShipment,
  onSelectShipment,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const t = useTranslations("trackShipment");
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("statuses.delivered")}
          </Badge>
        );
      case "in_transit":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Truck className="w-3 h-3 mr-1" />
            {t("statuses.inTransit")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            {t("statuses.pending")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{t("statuses.unknown")}</Badge>;
    }
  };

  return (
    <div className="lg:col-span-1 space-y-4">
      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: t("filterAll") },
              { value: "in_transit", label: t("filterInTransit") },
              { value: "pending", label: t("filterPending") },
              { value: "delivered", label: t("filterDelivered") },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipment Cards */}
      <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
        {shipments.map((shipment) => (
          <Card
            key={shipment.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedShipment?.id === shipment.id
                ? "ring-2 ring-primary border-primary"
                : ""
            }`}
            onClick={() => onSelectShipment(shipment)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {shipment.id}
                  </p>
                  <h3 className="font-medium">{shipment.productName}</h3>
                </div>
                {getStatusBadge(shipment.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 text-green-600" />
                  <span className="truncate">{shipment.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 text-red-600" />
                  <span className="truncate">{shipment.destination}</span>
                </div>
              </div>

              {shipment.status !== "pending" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {t("progress")}
                    </span>
                    <span className="font-medium">{shipment.progress}%</span>
                  </div>
                  <Progress value={shipment.progress} className="h-2" />
                </div>
              )}

              {shipment.isDemo && (
                <Badge
                  variant="outline"
                  className="mt-3 text-amber-600 border-amber-300 bg-amber-50 text-xs"
                >
                  Demo
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShipmentList;
