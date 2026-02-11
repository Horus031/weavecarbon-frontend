"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Globe,
  Ship,
  MapPin,
  ChevronRight,
  Clock,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import SupplyChainMap, {
  SupplyChainNode,
  SupplyChainRoute,
} from "./SupplyChainMap";
import ShipmentMiniMap from "./ShipmentMiniMap";
import type { TransportLeg } from "@/types/transport";
import ProductQRCode from "../ProductQRCode";
import ShipmentDetails from "../track-shipment/ShipmentDetails";
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

// Shipment type definition
interface Shipment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  status: "in_transit" | "delivered" | "pending";
  progress: number;
  origin: string;
  destination: string;
  estimatedArrival: string;
  currentLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  legs: TransportLeg[];
  totalCO2: number;
  carrier: string;
}

interface DetailShipment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  status: "in_transit" | "delivered" | "pending";
  progress: number;
  origin: string;
  destination: string;
  estimatedArrival: string;
  departureDate: string;
  currentLocation: string;
  legs: TransportLeg[];
  totalCO2: number;
  carrier: string;
  containerNo: string;
}

const deriveDepartureDate = (estimatedArrival: string) => {
  const arrival = new Date(estimatedArrival);
  if (Number.isNaN(arrival.getTime())) {
    return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
  }
  const departure = new Date(arrival);
  departure.setDate(departure.getDate() - 20);
  return departure.toISOString().split("T")[0];
};

const estimateArrivalDate = (product: StoredProduct) => {
  const baseDate = new Date(product.updatedAt || product.createdAt);
  const distance =
    product.estimatedTotalDistance ||
    product.transportLegs?.reduce(
      (sum, leg) => sum + (leg.estimatedDistance || 0),
      0,
    ) ||
    0;

  const fallbackDays = 14;
  const estimatedDays =
    distance > 0 ? Math.min(45, Math.max(2, Math.ceil(distance / 600))) : fallbackDays;

  const eta = new Date(baseDate);
  eta.setDate(eta.getDate() + estimatedDays);
  return eta.toISOString().split("T")[0];
};

const buildContainerNo = (shipment: Shipment) => {
  if (shipment.sku) return `WC-${shipment.sku}`;
  return shipment.id.replace("SHIP-", "WC-");
};

const toDetailShipment = (shipment: Shipment): DetailShipment => ({
  id: shipment.id,
  productId: shipment.productId,
  productName: shipment.productName,
  sku: shipment.sku,
  status: shipment.status,
  progress: shipment.progress,
  origin: shipment.origin,
  destination: shipment.destination,
  estimatedArrival: shipment.estimatedArrival,
  departureDate: deriveDepartureDate(shipment.estimatedArrival),
  currentLocation: shipment.currentLocation?.name || shipment.origin,
  legs: shipment.legs,
  totalCO2: shipment.totalCO2,
  carrier: shipment.carrier,
  containerNo: buildContainerNo(shipment),
});

// Helper to get approximate coordinates for common locations
const getLocationCoordinates = (
  city: string,
  country: string,
): { lat: number; lng: number } => {
  const locations: Record<string, { lat: number; lng: number }> = {
    // Vietnam
    "ho chi minh": { lat: 10.8231, lng: 106.6297 },
    "hcm": { lat: 10.8231, lng: 106.6297 },
    "tp.hcm": { lat: 10.8231, lng: 106.6297 },
    "hanoi": { lat: 21.0285, lng: 105.8542 },
    "ha noi": { lat: 21.0285, lng: 105.8542 },
    "hà nội": { lat: 21.0285, lng: 105.8542 },
    "da nang": { lat: 16.0544, lng: 108.2022 },
    "đà nẵng": { lat: 16.0544, lng: 108.2022 },
    "binh duong": { lat: 10.9808, lng: 106.6333 },
    "bình dương": { lat: 10.9808, lng: 106.6333 },
    "dong nai": { lat: 10.9454, lng: 106.8243 },
    "đồng nai": { lat: 10.9454, lng: 106.8243 },
    "việt nam": { lat: 14.0583, lng: 108.2772 },
    // International cities
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    "new york": { lat: 40.7128, lng: -74.006 },
    "tokyo": { lat: 35.6762, lng: 139.6503 },
    "seoul": { lat: 37.5665, lng: 126.978 },
    "rotterdam": { lat: 51.9244, lng: 4.4777 },
    "hamburg": { lat: 53.5511, lng: 9.9937 },
    "singapore": { lat: 1.3521, lng: 103.8198 },
    "shanghai": { lat: 31.2304, lng: 121.4737 },
    "hong kong": { lat: 22.3193, lng: 114.1694 },
    "sydney": { lat: -33.8688, lng: 151.2093 },
    "london": { lat: 51.5074, lng: -0.1278 },
    "paris": { lat: 48.8566, lng: 2.3522 },
    "berlin": { lat: 52.52, lng: 13.405 },
    // Destination market labels (Vietnamese)
    "hoa kỳ": { lat: 37.0902, lng: -95.7129 },
    "hàn quốc": { lat: 37.5665, lng: 126.978 },
    "nhật bản": { lat: 35.6762, lng: 139.6503 },
    "châu âu": { lat: 50.8503, lng: 4.3517 }, // Brussels as EU center
    "trung quốc": { lat: 31.2304, lng: 121.4737 },
  };

  const key = city.toLowerCase();
  if (locations[key]) return locations[key];

  // Default to country center if city not found
  const countryDefaults: Record<string, { lat: number; lng: number }> = {
    vietnam: { lat: 14.0583, lng: 108.2772 },
    usa: { lat: 37.0902, lng: -95.7129 },
    japan: { lat: 36.2048, lng: 138.2529 },
    korea: { lat: 35.9078, lng: 127.7669 },
    germany: { lat: 51.1657, lng: 10.4515 },
    france: { lat: 46.6034, lng: 1.8883 },
    netherlands: { lat: 52.1326, lng: 5.2913 },
    singapore: { lat: 1.3521, lng: 103.8198 },
    china: { lat: 35.8617, lng: 104.1954 },
    australia: { lat: -25.2744, lng: 133.7751 },
    uk: { lat: 55.3781, lng: -3.436 },
    eu: { lat: 50.8503, lng: 4.3517 },
  };

  const countryKey = country.toLowerCase();
  return countryDefaults[countryKey] || { lat: 10.8231, lng: 106.6297 };
};

// Helper to convert stored product to shipment format
const convertProductToShipment = (product: StoredProduct): Shipment | null => {
  const originCity = product.originAddress?.city || product.manufacturingLocation || "Ho Chi Minh";
  const originCountry = product.originAddress?.country || "Vietnam";
  const destMarket = DESTINATION_MARKETS.find(
    (m) => m.value === product.destinationMarket,
  );
  const destCity = product.destinationAddress?.city || destMarket?.label || "Unknown";
  const destCountry = product.destinationAddress?.country || destMarket?.label || "Unknown";

  // Use stored coordinates if available, otherwise fall back to geocoding lookup
  const originCoords = (product.originAddress?.lat && product.originAddress?.lng)
    ? { lat: product.originAddress.lat, lng: product.originAddress.lng }
    : getLocationCoordinates(originCity, originCountry);
  
  const destCoords = (product.destinationAddress?.lat && product.destinationAddress?.lng)
    ? { lat: product.destinationAddress.lat, lng: product.destinationAddress.lng }
    : getLocationCoordinates(destCity, destCountry);

  let legs: TransportLeg[];

  // If product has transport legs defined, use them
  if (product.transportLegs && product.transportLegs.length > 0) {
    legs = product.transportLegs.map((leg, index) => {
      const isLast = index === product.transportLegs.length - 1;
      const legOrigin = index === 0 ? originCoords : { lat: originCoords.lat + index * 5, lng: originCoords.lng + index * 10 };
      const legDest = isLast ? destCoords : { lat: originCoords.lat + (index + 1) * 5, lng: originCoords.lng + (index + 1) * 10 };

      const modeMapping: Record<string, "truck_light" | "truck_heavy" | "ship" | "air" | "rail"> = {
        road: "truck_heavy",
        sea: "ship",
        air: "air",
        rail: "rail",
      };

      const co2PerLeg = (product.carbonResults?.perProduct.transport || 0) / product.transportLegs.length;

      return {
        id: leg.id,
        legNumber: index + 1,
        type: index === 0 ? "domestic" as const : "international" as const,
        mode: modeMapping[leg.mode] || "truck_heavy",
        origin: {
          name: index === 0 ? `${originCity}, ${originCountry}` : `Transit ${index}`,
          lat: legOrigin.lat,
          lng: legOrigin.lng,
          type: index === 0 ? "address" as const : leg.mode === "sea" ? "port" as const : leg.mode === "air" ? "airport" as const : "address" as const,
        },
        destination: {
          name: isLast ? `${destCity}, ${destCountry}` : `Transit ${index + 1}`,
          lat: legDest.lat,
          lng: legDest.lng,
          type: isLast ? "address" as const : leg.mode === "sea" ? "port" as const : leg.mode === "air" ? "airport" as const : "address" as const,
        },
        distanceKm: leg.estimatedDistance || 1000,
        emissionFactor: leg.mode === "sea" ? 0.016 : leg.mode === "air" ? 0.602 : 0.105,
        co2Kg: co2PerLeg,
        routeType: leg.mode === "sea" ? "sea" as const : leg.mode === "air" ? "air" as const : "road" as const,
      };
    });
  } else {
    // Generate default route based on destination market
    const isInternational = product.destinationMarket && product.destinationMarket !== "vietnam";
    const defaultMode = isInternational ? "ship" : "truck_heavy";
    const estimatedDistance = product.estimatedTotalDistance || (isInternational ? 5000 : 500);
    const co2 = product.carbonResults?.perProduct.transport || estimatedDistance * (isInternational ? 0.016 : 0.105);

    legs = [{
      id: `leg-${product.id}-1`,
      legNumber: 1,
      type: isInternational ? "international" as const : "domestic" as const,
      mode: defaultMode as "truck_heavy" | "ship",
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
        type: isInternational ? "port" as const : "address" as const,
      },
      distanceKm: estimatedDistance,
      emissionFactor: isInternational ? 0.016 : 0.105,
      co2Kg: co2,
      routeType: isInternational ? "sea" as const : "road" as const,
    }];
  }

  const totalCO2 = product.carbonResults?.perProduct.transport || legs.reduce((sum, l) => sum + l.co2Kg, 0);

  // Determine current location based on status - for published, show at origin (pending)
  const currentLocation = {
    lat: originCoords.lat,
    lng: originCoords.lng,
    name: `${originCity}, ${originCountry} - Chờ vận chuyển`,
  };

  return {
    id: `SHIP-${product.id}`,
    productId: product.id,
    productName: product.productName,
    sku: product.productCode,
    status: "pending" as const,
    progress: 0,
    origin: `${originCity}, ${originCountry}`,
    destination: `${destCity}, ${destCountry}`,
    estimatedArrival: estimateArrivalDate(product),
    currentLocation,
    legs,
    totalCO2,
    carrier: "Unknown carrier",
  };
};

const ShippingOverviewMap: React.FC = () => {
  const t = useTranslations("logistics");
  const tTrack = useTranslations("trackShipment");
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [detailShipment, setDetailShipment] = useState<DetailShipment | null>(null);
  const [qrShipment, setQrShipment] = useState<Shipment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_transit" | "pending" | "delivered"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const openDetails = (shipment: Shipment) => {
    setDetailShipment(toDetailShipment(shipment));
  };

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
          .filter((s): s is Shipment => s !== null);
        setAllShipments(userShipments);
      } catch (error) {
        console.error("Error loading shipments:", error);
        setAllShipments([]);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("statuses.delivered")}
          </Badge>
        );
      case "in_transit":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Ship className="w-3 h-3 mr-1" />
            {t("statuses.inTransit")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {t("statuses.pending")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats summary
  const stats = useMemo(
    () => ({
      total: allShipments.length,
      inTransit: allShipments.filter((s) => s.status === "in_transit").length,
      delivered: allShipments.filter((s) => s.status === "delivered").length,
      pending: allShipments.filter((s) => s.status === "pending").length,
      totalCO2: allShipments.reduce((sum, s) => sum + s.totalCO2, 0),
    }),
    [allShipments],
  );

  // Prepare all nodes and routes for the world overview map
  const allNodes = useMemo((): SupplyChainNode[] => {
    const nodes: SupplyChainNode[] = [];
    const addedLocations = new Set<string>();

    allShipments.forEach((shipment) => {
      shipment.legs.forEach((leg, legIndex) => {
        // Add origin
        const originKey = `${leg.origin.lat.toFixed(2)}-${leg.origin.lng.toFixed(2)}`;
        if (!addedLocations.has(originKey)) {
          addedLocations.add(originKey);
          nodes.push({
            id: `${shipment.id}-${leg.id}-origin`,
            name: leg.origin.name,
            lat: leg.origin.lat,
            lng: leg.origin.lng,
            type:
              leg.origin.type === "port"
                ? "port"
                : leg.origin.type === "airport"
                  ? "airport"
                  : "factory",
            country: "Vietnam",
            co2: shipment.totalCO2,
            status:
              shipment.status === "delivered"
                ? "completed"
                : shipment.status === "pending"
                  ? "pending"
                  : "active",
          });
        }

        // Add destination for last leg
        if (legIndex === shipment.legs.length - 1) {
          const destKey = `${leg.destination.lat.toFixed(2)}-${leg.destination.lng.toFixed(2)}`;
          if (!addedLocations.has(destKey)) {
            addedLocations.add(destKey);
            nodes.push({
              id: `${shipment.id}-${leg.id}-dest`,
              name: leg.destination.name,
              lat: leg.destination.lat,
              lng: leg.destination.lng,
              type: "destination",
              country: shipment.destination.split(", ").pop() || "International",
              status: shipment.status === "delivered" ? "completed" : "pending",
            });
          }
        }
      });
    });

    return nodes;
  }, [allShipments]);

  const allRoutes = useMemo(
    (): SupplyChainRoute[] =>
      allShipments.flatMap((shipment) =>
        shipment.legs.map((leg) => ({
          id: `${shipment.id}-${leg.id}`,
          from: {
            lat: leg.origin.lat,
            lng: leg.origin.lng,
            name: leg.origin.name,
          },
          to: {
            lat: leg.destination.lat,
            lng: leg.destination.lng,
            name: leg.destination.name,
          },
          mode:
            leg.mode === "ship"
              ? ("ship" as const)
              : leg.mode === "air"
                ? ("air" as const)
                : ("truck" as const),
          status:
            shipment.status === "delivered"
              ? ("completed" as const)
              : shipment.status === "pending"
                ? ("pending" as const)
                : ("in_transit" as const),
          co2Kg: leg.co2Kg,
          distanceKm: leg.distanceKm,
        })),
      ),
    [allShipments],
  );

  const filteredShipments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allShipments.filter((shipment) => {
      if (statusFilter !== "all" && shipment.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        shipment.productName,
        shipment.sku,
        shipment.id,
        shipment.origin,
        shipment.destination,
        shipment.productId,
        shipment.carrier,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [allShipments, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredShipments.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedShipments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShipments, safeCurrentPage]);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{t("statuses.totalShipments")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {stats.inTransit}
            </p>
            <p className="text-xs text-muted-foreground">{t("statuses.inTransit")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.delivered}
            </p>
            <p className="text-xs text-muted-foreground">{t("statuses.delivered")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">{t("statuses.pending")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {stats.totalCO2.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">{t("statuses.totalCO2")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={tTrack("searchPlaceholder")}
            className="h-10 w-full md:w-80 lg:w-96 bg-background shadow-sm border border-primary/20 focus-visible:ring-primary/30"
          />
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            {tTrack("filterAll")}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "in_transit" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("in_transit");
              setCurrentPage(1);
            }}
          >
            {tTrack("filterInTransit")}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("pending");
              setCurrentPage(1);
            }}
          >
            {tTrack("filterPending")}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "delivered" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("delivered");
              setCurrentPage(1);
            }}
          >
            {tTrack("filterDelivered")}
          </Button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedShipments.map((shipment) => (
            <Card
              key={shipment.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => openDetails(shipment)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{shipment.productName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shipment.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(shipment.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrShipment(shipment);
                      }}
                      title={t("qrCodeTitle")}
                    >
                      <QrCode className="w-4 h-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mini Map showing current location */}
                <ShipmentMiniMap
                  currentLocation={shipment.currentLocation}
                  height="120px"
                  status={shipment.status}
                />

                {/* Shipment info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {shipment.origin}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {shipment.destination}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {shipment.totalCO2.toFixed(1)} kg CO2e
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {shipment.carrier}
                    </span>
                  </div>
                </div>

                {/* View details button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(shipment);
                  }}
                >
                  {t("viewRouteDetails")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredShipments.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
              >
                {t("pagination.prev")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("pagination.page", {
                  current: safeCurrentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(totalPages, Math.max(1, prev) + 1),
                  )
                }
                disabled={safeCurrentPage === totalPages}
              >
                {t("pagination.next")}
              </Button>
          </div>
        )}
      </div>

      {/* Map Overview */}
      <Card className="overflow-hidden border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            {t("mapTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <SupplyChainMap
            nodes={allNodes}
            routes={allRoutes}
            center={[20, 80]}
            zoom={2}
            height="520px"
            defaultMapMode="2d"
            showModeToggle={false}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!detailShipment}
        onOpenChange={(open) => {
          if (!open) setDetailShipment(null);
        }}
      >
        {detailShipment && (
          <DialogContent className="max-w-[68rem] w-[96vw] max-h-[90vh] overflow-y-auto overflow-x-hidden [&>button]:top-2 [&>button]:right-2">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {t("routeDetails")}: {detailShipment.productName}
              </DialogTitle>
            </DialogHeader>
            <ShipmentDetails shipment={detailShipment} />
          </DialogContent>
        )}
      </Dialog>

      {/* QR Code Modal */}
      {qrShipment && (
        <ProductQRCode
          productId={qrShipment.productId}
          productName={qrShipment.productName}
          sku={qrShipment.sku}
          isOpen={!!qrShipment}
          onClose={() => setQrShipment(null)}
        />
      )}
    </div>
  );
};

export default ShippingOverviewMap;
