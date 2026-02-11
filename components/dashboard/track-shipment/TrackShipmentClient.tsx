"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { api } from "@/lib/apiClient";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import type { TransportLeg } from "@/types/transport";
import type { TrackShipment } from "./types";
import {
  ProductAssessmentData,
  DESTINATION_MARKETS,
} from "@/components/dashboard/assessment/steps/types";

// Interface for stored products from assessment
interface StoredProduct extends ProductAssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const estimateArrivalDate = (product: StoredProduct) => {
  const baseDate = new Date(product.updatedAt || product.createdAt);
  const distance =
    product.estimatedTotalDistance ||
    product.transportLegs?.reduce(
      (sum, leg) => sum + (leg.estimatedDistance || 0),
      0,
    ) ||
    0;

  const estimatedDays =
    distance > 0 ? Math.min(45, Math.max(2, Math.ceil(distance / 600))) : 14;
  const eta = new Date(baseDate);
  eta.setDate(eta.getDate() + estimatedDays);
  return eta.toISOString().split("T")[0];
};

// Utility function to get coordinates (basic mapping)
const getLocationCoordinates = (
  city: string,
  country: string,
): { lat: number; lng: number } => {
  const locations: Record<string, { lat: number; lng: number }> = {
    "Ho Chi Minh": { lat: 10.7769, lng: 106.7009 },
    Hanoi: { lat: 21.0285, lng: 105.8542 },
    "Hai Phong": { lat: 20.8449, lng: 106.688 },
    Vietnam: { lat: 14.0583, lng: 108.2772 },
    USA: { lat: 37.0902, lng: -95.7129 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    "New York": { lat: 40.7128, lng: -74.006 },
    China: { lat: 35.8617, lng: 104.1954 },
    Japan: { lat: 36.2048, lng: 138.2529 },
    Singapore: { lat: 1.3521, lng: 103.8198 },
    UK: { lat: 55.3781, lng: -3.436 },
    Germany: { lat: 51.1657, lng: 10.4515 },
    France: { lat: 46.2276, lng: 2.2137 },
  };

  const key = Object.keys(locations).find(
    (k) =>
      k.toLowerCase() === city.toLowerCase() ||
      k.toLowerCase() === country.toLowerCase(),
  );
  return key ? locations[key] : { lat: 0, lng: 0 };
};

// Convert stored product to shipment format
const convertProductToShipment = (
  product: StoredProduct,
): TrackShipment | null => {
  try {
    const originCity =
      product.originAddress?.city ||
      product.manufacturingLocation ||
      "Ho Chi Minh";
    const originCountry = product.originAddress?.country || "Vietnam";
    const destMarket = DESTINATION_MARKETS.find(
      (m) => m.value === product.destinationMarket,
    );
    const destCity =
      product.destinationAddress?.city || destMarket?.label || "Unknown";
    const destCountry =
      product.destinationAddress?.country || destMarket?.label || "Unknown";

    // Use stored coordinates if available, otherwise geocode
    const originCoords = (product.originAddress?.lat && product.originAddress?.lng)
      ? { lat: product.originAddress.lat, lng: product.originAddress.lng }
      : getLocationCoordinates(originCity, originCountry);
    
    const destCoords = (product.destinationAddress?.lat && product.destinationAddress?.lng)
      ? { lat: product.destinationAddress.lat, lng: product.destinationAddress.lng }
      : getLocationCoordinates(destCity, destCountry);

    // Validate we got valid coordinates (not [0,0])
    if (!originCoords || (originCoords.lat === 0 && originCoords.lng === 0)) {
      originCoords.lat = 10.7769;
      originCoords.lng = 106.7009;
    }
    if (!destCoords || (destCoords.lat === 0 && destCoords.lng === 0)) {
      destCoords.lat = 34.0522;
      destCoords.lng = -118.2437;
    }

    const isInternational =
      product.destinationMarket && product.destinationMarket !== "vietnam";

    // Use transport legs from product if available, otherwise generate default
    let legs: TransportLeg[] = [];

    if (product.transportLegs && product.transportLegs.length > 0) {
      // Use product's transport legs
      legs = product.transportLegs.map((leg, index) => {
        const isLast = index === product.transportLegs.length - 1;
        const isFirst = index === 0;
        
        const modeMapping: Record<string, "truck_light" | "truck_heavy" | "ship" | "air" | "rail"> = {
          "road": "truck_heavy",
          "sea": "ship",
          "air": "air",
          "rail": "rail",
        };

        // For multi-leg routes, chain them together:
        // Leg 0: origin -> port/city
        // Leg 1+: previous leg's dest -> final destination (or next intermediate)
        let legOriginCoords;
        let legOriginName;
        let legOriginType: "address" | "port" | "airport";
        
        if (isFirst) {
          legOriginCoords = originCoords;
          legOriginName = `${originCity}, ${originCountry}`;
          legOriginType = "address";
        } else {
          // For subsequent legs, we need to create intermediate points
          // Use a simple approach: divide the remaining distance into intermediate ports
          const legProgress = index / product.transportLegs.length;
          legOriginCoords = {
            lat: originCoords.lat + (destCoords.lat - originCoords.lat) * legProgress,
            lng: originCoords.lng + (destCoords.lng - originCoords.lng) * legProgress,
          };
          legOriginName = `Transit Point ${index}`;
          legOriginType = leg.mode === "sea" ? "port" : leg.mode === "air" ? "airport" : "address";
        }

        let legDestCoords;
        let legDestName;
        let legDestType: "address" | "port" | "airport";

        if (isLast) {
          legDestCoords = destCoords;
          legDestName = `${destCity}, ${destCountry}`;
          legDestType = "address";
        } else {
          // For non-last legs, create the next intermediate point
          const legProgress = (index + 1) / product.transportLegs.length;
          legDestCoords = {
            lat: originCoords.lat + (destCoords.lat - originCoords.lat) * legProgress,
            lng: originCoords.lng + (destCoords.lng - originCoords.lng) * legProgress,
          };
          legDestName = `Transit Point ${index + 1}`;
          legDestType = leg.mode === "sea" ? "port" : leg.mode === "air" ? "airport" : "address";
        }

        return {
          id: leg.id || `leg-${product.id}-${index}`,
          legNumber: index + 1,
          type: index === 0 ? ("domestic" as const) : ("international" as const),
          mode: modeMapping[leg.mode] || "truck_heavy",
          origin: {
            name: legOriginName,
            lat: legOriginCoords.lat,
            lng: legOriginCoords.lng,
            type: legOriginType,
          },
          destination: {
            name: legDestName,
            lat: legDestCoords.lat,
            lng: legDestCoords.lng,
            type: legDestType,
          },
          distanceKm: leg.estimatedDistance || (isInternational ? 5000 : 500),
          emissionFactor: leg.mode === "sea" ? 0.016 : leg.mode === "air" ? 0.602 : 0.105,
          co2Kg: (product.carbonResults?.perProduct.transport || 0) / product.transportLegs.length,
          routeType: (leg.mode === "sea" ? "sea" : leg.mode === "air" ? "air" : "road") as "road" | "sea" | "air",
        };
      });
    } else {
      // Generate default leg
      const distanceKm = product.estimatedTotalDistance || (isInternational ? 5000 : 500);
      const transportCO2 = product.carbonResults?.perProduct.transport || (distanceKm * (isInternational ? 0.016 : 0.105));

      legs = [
        {
          id: `leg-${product.id}-1`,
          legNumber: 1,
          type: isInternational ? ("international" as const) : ("domestic" as const),
          mode: isInternational ? ("ship" as const) : ("truck_heavy" as const),
          origin: {
            name: `${originCity}, ${originCountry}`,
            lat: originCoords.lat,
            lng: originCoords.lng,
            type: "address" as const,
          },
          destination: {
            name: `${destCity}, ${destCountry}`,
            lat: destCoords.lat,
            lng: destCoords.lng,
            type: isInternational ? ("port" as const) : ("address" as const),
          },
          distanceKm,
          emissionFactor: isInternational ? 0.016 : 0.105,
          co2Kg: transportCO2,
          routeType: isInternational ? ("sea" as const) : ("road" as const),
        },
      ];
    }

    const totalCO2 = product.carbonResults?.perProduct.transport || 0;

    return {
      id: product.id,
      productId: product.id,
      productName: product.productName,
      sku: `SKU-${product.id.slice(0, 8)}`,
      status: "pending" as const,
      progress: 0,
      origin: `${originCity}, ${originCountry}`,
      destination: `${destCity}, ${destCountry}`,
      estimatedArrival: estimateArrivalDate(product),
      departureDate: new Date().toISOString().split("T")[0],
      currentLocation: `${originCity}, ${originCountry}`,
      legs,
      totalCO2,
      carrier: "Unknown carrier",
      containerNo: `CNT-${product.id.slice(0, 6).toUpperCase()}`,
    };
  } catch (error) {
    console.error(
      `[TrackShipment] Error converting product ${product.productName}:`,
      error,
    );
    return null;
  }
};

const TrackShipmentClient: React.FC = () => {
  const t = useTranslations("trackShipment");
  const { setPageTitle } = useDashboardTitle();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [allShipments, setAllShipments] = useState<TrackShipment[]>([]);
  const [selectedShipment, setSelectedShipment] =
    useState<TrackShipment | null>(null);

  useEffect(() => {
    setPageTitle(
      t("title"),
      t("subtitle"),
    );
  }, [setPageTitle, t]);

  // Load published products from localStorage and convert to shipments
  useEffect(() => {
    const loadUserShipments = async () => {
      try {
        let products: StoredProduct[] = [];
        try {
          products = await api.get<StoredProduct[]>("/products?status=published");
        } catch {
          const storedProducts = localStorage.getItem("weavecarbonProducts");
          products = storedProducts
            ? (JSON.parse(storedProducts) as StoredProduct[])
            : [];
        }

        const publishedProducts = products.filter((p) => p.status === "published");

        const userShipments = publishedProducts
          .map((p) => convertProductToShipment(p))
          .filter((s): s is TrackShipment => s !== null);

        setAllShipments(userShipments);
        setSelectedShipment(userShipments[0] ?? null);
      } catch (error) {
        console.error("Error loading shipments:", error);
      }
    };

    void loadUserShipments();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "weavecarbonProducts") {
        void loadUserShipments();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const filteredShipments = allShipments.filter((shipment) => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.containerNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    const load = async () => {
      try {
        let products: StoredProduct[] = [];
        try {
          products = await api.get<StoredProduct[]>("/products?status=published");
        } catch {
          const storedProducts = localStorage.getItem("weavecarbonProducts");
          products = storedProducts
            ? (JSON.parse(storedProducts) as StoredProduct[])
            : [];
        }

        const publishedProducts = products.filter((p) => p.status === "published");
        const userShipments = publishedProducts
          .map((p) => convertProductToShipment(p))
          .filter((s): s is TrackShipment => s !== null);

        setAllShipments(userShipments);
        setSelectedShipment((prev) => {
          if (!prev) return userShipments[0] || null;
          return userShipments.find((s) => s.id === prev.id) || userShipments[0] || null;
        });
      } catch (error) {
        console.error("Error refreshing shipments:", error);
      }
    };

    void load();
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <ShipmentList
          shipments={filteredShipments}
          selectedShipment={selectedShipment}
          onSelectShipment={setSelectedShipment}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <ShipmentDetails shipment={selectedShipment} onRefresh={handleRefresh} />
      </div>
    </div>
  );
};

export default TrackShipmentClient;
