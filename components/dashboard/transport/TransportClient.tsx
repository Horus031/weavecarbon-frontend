"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Plus, Map } from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import TransportScopeSelector from "./TransportScopeSelector";
import TransportLegCard from "./TransportLegCard";
import TransportResultsSidebar from "./TransportResultsSidebar";
import PermissionDialog from "@/components/ui/PermissionDialog";
import TransportMap from "@/components/ui/TransportMap";
import { DEMO_VIETNAM_LA_ROUTE } from "@/lib/logisticData";

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
  isDemo?: boolean;
}

const TransportClient: React.FC<TransportClientProps> = ({
  productId,
  productName,
  productCode,
  isDemo = false,
}) => {
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const { addCalculation } = useCalculationHistory();
  const [transportScope, setTransportScope] = useState<
    "domestic" | "international"
  >("international");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showDemoMap, setShowDemoMap] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [legs, setLegs] = useState<LegInput[]>([
    {
      id: "1",
      type: "international",
      mode: "ship",
      origin: {
        streetAddress: "Nhà máy dệt may Bình Dương",
        aptSuite: "",
        city: "Thủ Dầu Một",
        state: "BD",
        zipPostcode: "820000",
        country: "VN",
        lat: "10.9804",
        lng: "106.6519",
      },
      destination: {
        streetAddress: "123 Warehouse District",
        aptSuite: "Building A",
        city: "Los Angeles",
        state: "CA",
        zipPostcode: "90001",
        country: "US",
        lat: "34.0522",
        lng: "-118.2437",
      },
      distanceKm: "14580",
    },
  ]);

  useEffect(() => {
    setPageTitle(
      "Vận chuyển & Logistics",
      "Nhập thông tin vận chuyển và tính toán phát thải",
    );
  }, [setPageTitle]);

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
    // Calculate total CO2 with breakdown
    const materialsCO2 = 2.5; // Simplified
    const manufacturingCO2 = 1.5; // Simplified
    const transportCO2 = getTotalCO2();
    const packagingCO2 = 0.15; // Simplified
    const totalCO2 =
      materialsCO2 + manufacturingCO2 + transportCO2 + packagingCO2;

    // Save to calculation history
    const calculation = addCalculation({
      productId: productId || `product-${Date.now()}`,
      productName: productName || "Demo Product",
      materialsCO2,
      manufacturingCO2,
      transportCO2,
      packagingCO2,
      totalCO2,
      carbonVersion: "v2024.1-DEFRA",
      createdBy: "current-user",
      isDemo: isDemo,
    });

    // Redirect to calculation history page
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
              {isDemo && (
                <Badge variant="outline" className="ml-auto">
                  Demo
                </Badge>
              )}
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

            {/* Demo Map Section */}
            {showDemoMap && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Map className="w-5 h-5 text-primary" />
                    Demo: Việt Nam → Los Angeles
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-300 bg-amber-50"
                  >
                    Demo - Chỉ để học hỏi
                  </Badge>
                </div>
                <TransportMap legs={DEMO_VIETNAM_LA_ROUTE} isDemo={true} />
              </div>
            )}

            {/* Add Leg Button */}
            <Button variant="outline" onClick={handleAddLeg} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Thêm chặng vận chuyển
            </Button>

            {/* Toggle Demo Map */}
            <Button
              variant={showDemoMap ? "secondary" : "outline"}
              onClick={() => setShowDemoMap(!showDemoMap)}
              className="w-full"
            >
              <Map className="w-4 h-4 mr-2" />
              {showDemoMap ? "Ẩn bản đồ demo" : "Xem bản đồ demo Việt Nam → LA"}
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
