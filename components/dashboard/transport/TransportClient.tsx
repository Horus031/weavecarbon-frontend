"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Route, Plus } from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import TransportScopeSelector from "./TransportScopeSelector";
import TransportLegCard from "./TransportLegCard";
import TransportResultsSidebar from "./TransportResultsSidebar";
import PermissionDialog from "@/components/ui/PermissionDialog";

export interface AddressData {
  streetAddress: string;
  aptSuite: string;
  city: string;
  state: string;
  zipPostcode: string;
  country: string;
  lat?: string;
  lng?: string;
}

export interface LegInput {
  id: string;
  type: "domestic" | "international";
  mode: "truck_light" | "truck_heavy" | "ship" | "air" | "rail";
  origin: AddressData;
  destination: AddressData;
  distanceKm: string;
}

const createEmptyAddress = (): AddressData => ({
  streetAddress: "",
  aptSuite: "",
  city: "",
  state: "",
  zipPostcode: "",
  country: "VN",
  lat: "",
  lng: "",
});

const EMISSION_FACTORS: Record<string, number> = {
  truck_light: 0.089,
  truck_heavy: 0.105,
  ship: 0.016,
  air: 0.602,
  rail: 0.028,
};

interface TransportClientProps {
  productId?: string;
  productName?: string;
  productCode?: string;
}

const TransportClient: React.FC<TransportClientProps> = ({
  productId,
  productName,
  productCode,
}) => {
  const t = useTranslations("transport");
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const [transportScope, setTransportScope] = useState<
    "domestic" | "international"
  >("international");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [legs, setLegs] = useState<LegInput[]>([
    {
      id: "1",
      type: "international",
      mode: "ship",
      origin: createEmptyAddress(),
      destination: createEmptyAddress(),
      distanceKm: "",
    },
  ]);

  useEffect(() => {
    setPageTitle(
      t("title"),
      t("subtitle"),
    );
  }, [setPageTitle, t]);

  const handleAddLeg = () => {
    const newLeg: LegInput = {
      id: String(Date.now()),
      type: transportScope,
      mode: transportScope === "domestic" ? "truck_light" : "ship",
      origin: createEmptyAddress(),
      destination: createEmptyAddress(),
      distanceKm: "",
    };
    setLegs([...legs, newLeg]);
  };

  const handleRemoveLeg = (id: string) => {
    if (legs.length > 1) {
      setLegs(legs.filter((leg) => leg.id !== id));
    }
  };

  const updateLeg = (
    id: string,
    field: keyof LegInput,
    value: string | AddressData,
  ) => {
    setLegs(
      legs.map((leg) => (leg.id === id ? { ...leg, [field]: value } : leg)),
    );
  };

  const calculateLegCO2 = (leg: LegInput): number => {
    const distance = parseFloat(leg.distanceKm) || 0;
    const factor = EMISSION_FACTORS[leg.mode] || 0;
    return distance * factor;
  };

  const getTotalDistance = () => {
    return legs.reduce(
      (sum, leg) => sum + (parseFloat(leg.distanceKm) || 0),
      0,
    );
  };

  const getTotalCO2 = () => {
    return legs.reduce((sum, leg) => sum + calculateLegCO2(leg), 0);
  };

  const handleSubmit = () => {
    router.push(`/calculation-history?productId=${productId}`);
  };

  const handleLocationPermission = async () => {
    setHasLocationPermission(true);
    setShowLocationDialog(false);
  };

  return (
    <>
      <PermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        type="location"
        onAllow={handleLocationPermission}
        onDeny={() => setShowLocationDialog(false)}
      />

      <div className="space-y-6">
        {/* Product Context */}
        {productId && (
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{productName}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {productCode}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transport Scope */}
            <TransportScopeSelector
              value={transportScope}
              onChange={setTransportScope}
            />

            {/* Transport Legs */}
            {legs.map((leg, index) => (
              <TransportLegCard
                key={leg.id}
                leg={leg}
                index={index}
                canRemove={legs.length > 1}
                hasLocationPermission={hasLocationPermission}
                onUpdate={updateLeg}
                onRemove={handleRemoveLeg}
                calculateCO2={calculateLegCO2}
              />
            ))}

            {/* Add Leg Button */}
            <Button variant="outline" onClick={handleAddLeg} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t("addLeg")}
            </Button>

          </div>

          {/* Sidebar - Results */}
          <TransportResultsSidebar
            legs={legs}
            totalDistance={getTotalDistance()}
            totalCO2={getTotalCO2()}
            hasLocationPermission={hasLocationPermission}
            calculateLegCO2={calculateLegCO2}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
};

export default TransportClient;
