"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Calendar,
  Clock,
  Anchor,
  Ship,
  Plane,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { TRANSPORT_MODE_LABELS } from "@/lib/productLabels";
import type { TrackShipment } from "./types";
import TransportMap from "@/components/ui/TransportMap";

interface ShipmentDetailsProps {
  shipment: TrackShipment | null;
  onRefresh?: () => void;
}

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({
  shipment,
  onRefresh,
}) => {
  const t = useTranslations("trackShipment");
  const router = useRouter();

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

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "ship":
        return Ship;
      case "air":
        return Plane;
      default:
        return Truck;
    }
  };

  if (!shipment) {
    return (
      <div className="lg:col-span-2">
        <Card className="h-96 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4" />
            <p>{t("selectShipment")}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Map */}
      <TransportMap legs={shipment.legs} onRefresh={onRefresh} />

      {/* Shipment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {shipment.productName}
              </CardTitle>
              <CardDescription>
                {shipment.id} • Container: {shipment.containerNo}
              </CardDescription>
            </div>
            {getStatusBadge(shipment.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Location */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium">{t("currentLocation")}</span>
            </div>
            <p className="text-lg font-semibold text-primary">
              {shipment.currentLocation}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t("departureDate")}</p>
              <p className="font-medium">
                {new Date(shipment.departureDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t("estimatedArrival")}</p>
              <p className="font-medium">
                {new Date(shipment.estimatedArrival).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Anchor className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t("carrier")}</p>
              <p className="font-medium text-sm truncate">{shipment.carrier}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="w-5 h-5 mx-auto mb-1 text-orange-500 font-bold text-xs flex items-center justify-center">
                CO₂
              </div>
              <p className="text-xs text-muted-foreground">{t("emissions")}</p>
              <p className="font-medium text-orange-600">
                {shipment.totalCO2.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div>
            <h4 className="font-medium mb-4">{t("timeline")}</h4>
            <div className="space-y-4">
              {shipment.legs.map((leg, index) => {
                const Icon = getModeIcon(leg.mode);
                const isComplete =
                  shipment.progress >=
                  ((index + 1) / shipment.legs.length) * 100;
                const isActive =
                  shipment.progress > (index / shipment.legs.length) * 100 &&
                  shipment.progress <
                    ((index + 1) / shipment.legs.length) * 100;

                return (
                  <div key={leg.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete
                            ? "bg-green-100 text-green-600"
                            : isActive
                              ? "bg-primary text-white animate-pulse"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < shipment.legs.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-2 ${
                            isComplete ? "bg-green-300" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">
                          {t("legNumber")} {leg.legNumber}:{" "}
                          {TRANSPORT_MODE_LABELS[leg.mode]}
                        </h5>
                        <Badge
                          variant={
                            leg.type === "international"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {leg.type === "international" ? t("international") : t("domestic")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {leg.origin.name} → {leg.destination.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{leg.distanceKm.toLocaleString()} km</span>
                        <span className="text-orange-500">
                          {leg.co2Kg.toFixed(2)} kg CO₂
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                router.push(`/transport?productId=${shipment.productId}`)
              }
            >
              {t("viewLogistics")}
            </Button>
            <Button
              className="flex-1"
              onClick={() =>
                router.push(
                  `/calculation-history?productId=${shipment.productId}`,
                )
              }
            >
              {t("viewCarbonHistory")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentDetails;
