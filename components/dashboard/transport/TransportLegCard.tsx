"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ship, Plane, Truck, Trash2, MapPin, Info } from "lucide-react";
import AddressSelection from "@/components/ui/AddressSelection";
import { LegInput, AddressData } from "./TransportClient";

const EMISSION_FACTORS: Record<string, number> = {
  truck_light: 0.089,
  truck_heavy: 0.105,
  ship: 0.016,
  air: 0.602,
  rail: 0.028,
};

const TRANSPORT_MODE_LABELS: Record<string, string> = {
  truck_light: "Xe tải nhẹ",
  truck_heavy: "Xe tải nặng",
  ship: "Tàu biển",
  air: "Máy bay",
  rail: "Đường sắt",
};

interface TransportLegCardProps {
  leg: LegInput;
  index: number;
  canRemove: boolean;
  hasLocationPermission: boolean;
  onUpdate: (id: string, field: keyof LegInput, value: string | AddressData) => void;
  onRemove: (id: string) => void;
  calculateCO2: (leg: LegInput) => number;
}

const TransportLegCard: React.FC<TransportLegCardProps> = ({
  leg,
  index,
  canRemove,
  hasLocationPermission,
  onUpdate,
  onRemove,
  calculateCO2,
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getModeIcon(leg.mode)}
            Chặng {index + 1}
          </CardTitle>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(leg.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transport Mode */}
        <div>
          <Label>Phương thức vận chuyển</Label>
          <Select
            value={leg.mode}
            onValueChange={(v) => onUpdate(leg.id, "mode", v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="truck_light">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Xe tải nhẹ
                </div>
              </SelectItem>
              <SelectItem value="truck_heavy">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Xe tải nặng
                </div>
              </SelectItem>
              <SelectItem value="ship">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4" />
                  Tàu biển
                </div>
              </SelectItem>
              <SelectItem value="air">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Máy bay
                </div>
              </SelectItem>
              <SelectItem value="rail">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Đường sắt
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Origin */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Điểm A - Điểm lấy hàng
          </div>
          <AddressSelection
            value={leg.origin}
            onChange={(address) => onUpdate(leg.id, "origin", address)}
            showCoordinates={true}
          />
        </div>

        {/* Destination */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <MapPin className="w-4 h-4 text-destructive" />
            Điểm B - Điểm giao hàng
          </div>
          <AddressSelection
            value={leg.destination}
            onChange={(address) => onUpdate(leg.id, "destination", address)}
            showCoordinates={true}
          />
        </div>

        {/* Distance */}
        <div>
          <Label>Khoảng cách (km)</Label>
          <Input
            type="number"
            placeholder="Nhập khoảng cách"
            value={leg.distanceKm}
            onChange={(e) => onUpdate(leg.id, "distanceKm", e.target.value)}
            className="mt-1"
          />
          {!hasLocationPermission && (
            <p className="text-xs text-muted-foreground mt-1">
              <Info className="w-3 h-3 inline mr-1" />
              Bật vị trí để tự động tính khoảng cách
            </p>
          )}
        </div>

        {/* Leg CO2 Result */}
        {parseFloat(leg.distanceKm) > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">CO₂ chặng này</span>
              <span className="font-medium text-primary">
                {calculateCO2(leg).toFixed(2)} kg CO₂e
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hệ số: {EMISSION_FACTORS[leg.mode]} kg CO₂/km (
              {TRANSPORT_MODE_LABELS[leg.mode]})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransportLegCard;
