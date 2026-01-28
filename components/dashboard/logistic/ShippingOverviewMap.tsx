"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Ship,
  MapPin,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  X,
  QrCode,
} from "lucide-react";
import SupplyChainMap, {
  SupplyChainNode,
  SupplyChainRoute,
} from "./SupplyChainMap";
import ShipmentMiniMap from "./ShipmentMiniMap";
import { TransportLeg } from "@/lib/demoData";
import ProductQRCode from "../ProductQRCode";

// Demo route data
const DEMO_VIETNAM_LA_ROUTE: TransportLeg[] = [
  {
    id: "leg-1",
    legNumber: 1,
    type: "domestic",
    mode: "truck_heavy",
    origin: {
      name: "Nhà máy Bình Dương",
      lat: 10.9808,
      lng: 106.6333,
      type: "address",
    },
    destination: {
      name: "Cảng Cát Lái",
      lat: 10.7531,
      lng: 106.7567,
      type: "port",
    },
    distanceKm: 35,
    emissionFactor: 0.105,
    co2Kg: 3.68,
    routeType: "road",
  },
  {
    id: "leg-2",
    legNumber: 2,
    type: "international",
    mode: "ship",
    origin: { name: "Cảng Cát Lái", lat: 10.7531, lng: 106.7567, type: "port" },
    destination: {
      name: "Cảng Los Angeles",
      lat: 33.7361,
      lng: -118.2631,
      type: "port",
    },
    distanceKm: 14500,
    emissionFactor: 0.016,
    co2Kg: 232.0,
    routeType: "sea",
  },
  {
    id: "leg-3",
    legNumber: 3,
    type: "domestic",
    mode: "truck_light",
    origin: {
      name: "Cảng Los Angeles",
      lat: 33.7361,
      lng: -118.2631,
      type: "port",
    },
    destination: {
      name: "Kho LA Distribution",
      lat: 34.0522,
      lng: -118.2437,
      type: "address",
    },
    distanceKm: 45,
    emissionFactor: 0.089,
    co2Kg: 4.01,
    routeType: "road",
  },
];

// All shipments data for the world map
const ALL_SHIPMENTS = [
  {
    id: "SHIP-2024-001",
    productId: "demo-product-001",
    productName: "Áo T-shirt Organic Cotton",
    sku: "DEMO-SKU-001",
    status: "in_transit" as const,
    progress: 65,
    origin: "Bình Dương, Vietnam",
    destination: "Los Angeles, USA",
    estimatedArrival: "2024-02-15",
    currentLocation: {
      lat: 25,
      lng: -160,
      name: "Thái Bình Dương - Gần Hawaii",
    },
    legs: DEMO_VIETNAM_LA_ROUTE,
    totalCO2: 239.69,
    carrier: "COSCO Shipping",
  },
  {
    id: "SHIP-2024-002",
    productId: "demo-product-003",
    productName: "Váy Linen Blend",
    sku: "DEMO-SKU-003",
    status: "delivered" as const,
    progress: 100,
    origin: "Đà Nẵng, Vietnam",
    destination: "Tokyo, Japan",
    estimatedArrival: "2024-01-22",
    currentLocation: {
      lat: 35.7647,
      lng: 140.3864,
      name: "Tokyo, Japan - Đã giao",
    },
    legs: [
      {
        id: "leg-jp-1",
        legNumber: 1,
        type: "domestic" as const,
        mode: "truck_heavy" as const,
        origin: {
          name: "Nhà máy Đà Nẵng",
          lat: 16.0544,
          lng: 108.2022,
          type: "address" as const,
        },
        destination: {
          name: "Sân bay Đà Nẵng",
          lat: 16.0439,
          lng: 108.1997,
          type: "airport" as const,
        },
        distanceKm: 5,
        emissionFactor: 0.105,
        co2Kg: 0.53,
        routeType: "road" as const,
      },
      {
        id: "leg-jp-2",
        legNumber: 2,
        type: "international" as const,
        mode: "air" as const,
        origin: {
          name: "Sân bay Đà Nẵng",
          lat: 16.0439,
          lng: 108.1997,
          type: "airport" as const,
        },
        destination: {
          name: "Sân bay Narita, Tokyo",
          lat: 35.7647,
          lng: 140.3864,
          type: "airport" as const,
        },
        distanceKm: 3850,
        emissionFactor: 0.602,
        co2Kg: 2317.7,
        routeType: "air" as const,
      },
    ],
    totalCO2: 2318.23,
    carrier: "Vietnam Airlines Cargo",
  },
  {
    id: "SHIP-2024-003",
    productId: "demo-product-002",
    productName: "Quần Jeans Recycled Denim",
    sku: "DEMO-SKU-002",
    status: "pending" as const,
    progress: 0,
    origin: "TP.HCM, Vietnam",
    destination: "Rotterdam, Netherlands",
    estimatedArrival: "2024-03-05",
    currentLocation: {
      lat: 10.7531,
      lng: 106.7567,
      name: "Cảng Cát Lái, TP.HCM",
    },
    legs: [
      {
        id: "leg-eu-1",
        legNumber: 1,
        type: "domestic" as const,
        mode: "truck_light" as const,
        origin: {
          name: "Nhà máy Q.12, TP.HCM",
          lat: 10.8675,
          lng: 106.6417,
          type: "address" as const,
        },
        destination: {
          name: "Cảng Cát Lái, TP.HCM",
          lat: 10.7531,
          lng: 106.7567,
          type: "port" as const,
        },
        distanceKm: 28,
        emissionFactor: 0.089,
        co2Kg: 2.49,
        routeType: "road" as const,
      },
      {
        id: "leg-eu-2",
        legNumber: 2,
        type: "international" as const,
        mode: "ship" as const,
        origin: {
          name: "Cảng Cát Lái, TP.HCM",
          lat: 10.7531,
          lng: 106.7567,
          type: "port" as const,
        },
        destination: {
          name: "Cảng Rotterdam, Hà Lan",
          lat: 51.9244,
          lng: 4.4777,
          type: "port" as const,
        },
        distanceKm: 17200,
        emissionFactor: 0.016,
        co2Kg: 275.2,
        routeType: "sea" as const,
      },
    ],
    totalCO2: 277.69,
    carrier: "Maersk Line",
  },
];

interface ShippingOverviewMapProps {
  onViewDetails?: () => void;
}

// Helper function to convert TransportLeg[] to SupplyChainNode[]
const convertLegsToNodes = (
  legs: TransportLeg[],
  shipmentStatus: string,
): SupplyChainNode[] => {
  const nodes: SupplyChainNode[] = [];
  const addedLocations = new Set<string>();

  legs.forEach((leg, index) => {
    // Add origin
    const originKey = `${leg.origin.lat}-${leg.origin.lng}`;
    if (!addedLocations.has(originKey)) {
      addedLocations.add(originKey);
      nodes.push({
        id: `${leg.id}-origin`,
        name: leg.origin.name,
        lat: leg.origin.lat,
        lng: leg.origin.lng,
        type:
          leg.origin.type === "port"
            ? "port"
            : leg.origin.type === "airport"
              ? "airport"
              : "factory",
        country:
          leg.type === "domestic" && index === 0 ? "Vietnam" : "International",
        status:
          shipmentStatus === "delivered"
            ? "completed"
            : index === 0
              ? "completed"
              : "active",
      });
    }

    // Add destination (especially for last leg)
    const destKey = `${leg.destination.lat}-${leg.destination.lng}`;
    if (!addedLocations.has(destKey)) {
      addedLocations.add(destKey);
      nodes.push({
        id: `${leg.id}-dest`,
        name: leg.destination.name,
        lat: leg.destination.lat,
        lng: leg.destination.lng,
        type:
          leg.destination.type === "port"
            ? "port"
            : leg.destination.type === "airport"
              ? "airport"
              : "destination",
        country: "Destination",
        status:
          shipmentStatus === "delivered"
            ? "completed"
            : shipmentStatus === "pending"
              ? "pending"
              : "active",
      });
    }
  });

  return nodes;
};

// Helper function to convert TransportLeg[] to SupplyChainRoute[]
const convertLegsToRoutes = (
  legs: TransportLeg[],
  shipmentStatus: string,
): SupplyChainRoute[] => {
  return legs.map((leg, index) => {
    let routeStatus: "completed" | "in_transit" | "pending" = "pending";

    if (shipmentStatus === "delivered") {
      routeStatus = "completed";
    } else if (shipmentStatus === "in_transit") {
      routeStatus = index < legs.length - 1 ? "completed" : "in_transit";
    }

    return {
      id: leg.id,
      from: { lat: leg.origin.lat, lng: leg.origin.lng, name: leg.origin.name },
      to: {
        lat: leg.destination.lat,
        lng: leg.destination.lng,
        name: leg.destination.name,
      },
      mode: leg.mode === "ship" ? "ship" : leg.mode === "air" ? "air" : "truck",
      status: routeStatus,
      co2Kg: leg.co2Kg,
      distanceKm: leg.distanceKm,
    };
  });
};

const ShippingOverviewMap: React.FC<ShippingOverviewMapProps> = ({
  onViewDetails,
}) => {
  const [selectedShipment, setSelectedShipment] = useState<
    (typeof ALL_SHIPMENTS)[0] | null
  >(null);
  const [qrShipment, setQrShipment] = useState<
    (typeof ALL_SHIPMENTS)[0] | null
  >(null);
  const [mapMode, setMapMode] = useState<"overview" | "detail">("overview");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã giao
          </Badge>
        );
      case "in_transit":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Ship className="w-3 h-3 mr-1" />
            Đang vận chuyển
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats summary
  const stats = {
    total: ALL_SHIPMENTS.length,
    inTransit: ALL_SHIPMENTS.filter((s) => s.status === "in_transit").length,
    delivered: ALL_SHIPMENTS.filter((s) => s.status === "delivered").length,
    pending: ALL_SHIPMENTS.filter((s) => s.status === "pending").length,
    totalCO2: ALL_SHIPMENTS.reduce((sum, s) => sum + s.totalCO2, 0),
  };

  // Prepare all nodes and routes for the world overview map
  const allNodes = useMemo((): SupplyChainNode[] => {
    const nodes: SupplyChainNode[] = [];
    const addedLocations = new Set<string>();

    ALL_SHIPMENTS.forEach((shipment) => {
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
              country:
                shipment.destination.split(", ").pop() || "International",
              status: shipment.status === "delivered" ? "completed" : "pending",
            });
          }
        }
      });
    });

    return nodes;
  }, []);

  const allRoutes: SupplyChainRoute[] = ALL_SHIPMENTS.flatMap((shipment) =>
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
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Tổng shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {stats.inTransit}
            </p>
            <p className="text-xs text-muted-foreground">Đang vận chuyển</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.delivered}
            </p>
            <p className="text-xs text-muted-foreground">Đã giao</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Chờ xử lý</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {stats.totalCO2.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">kg CO₂e tổng</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Map View - Shows both overview and detail */}
      <Card className="overflow-hidden border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              {mapMode === "overview"
                ? "Bản đồ vận chuyển toàn cầu"
                : `Chi tiết tuyến: ${selectedShipment?.productName}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              {mapMode === "detail" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMapMode("overview");
                    setSelectedShipment(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Quay lại bản đồ toàn cầu
                </Button>
              )}
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 bg-amber-50"
              >
                Demo Data
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {mapMode === "overview"
              ? "Nhấn vào sản phẩm để xem chi tiết tuyến đường"
              : selectedShipment?.origin + " → " + selectedShipment?.destination}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <SupplyChainMap
            nodes={
              mapMode === "detail" && selectedShipment
                ? convertLegsToNodes(
                    selectedShipment.legs,
                    selectedShipment.status,
                  )
                : allNodes
            }
            routes={
              mapMode === "detail" && selectedShipment
                ? convertLegsToRoutes(
                    selectedShipment.legs,
                    selectedShipment.status,
                  )
                : allRoutes
            }
            center={mapMode === "overview" ? [20, 80] : undefined}
            zoom={mapMode === "overview" ? 2 : 4}
            height="500px"
            defaultMapMode="2d"
            showModeToggle={false}
            onNodeClick={(node) => {
              if (mapMode === "overview") {
                // Find shipment that contains this node
                const shipment = ALL_SHIPMENTS.find((s) =>
                  s.legs.some(
                    (leg) =>
                      leg.origin.name === node.name ||
                      leg.destination.name === node.name,
                  ),
                );
                if (shipment) {
                  setSelectedShipment(shipment);
                  setMapMode("detail");
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Shipment Cards with Mini Maps - Always visible as quick reference */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Tuyến vận chuyển</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {ALL_SHIPMENTS.map((shipment) => (
            <Card
              key={shipment.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedShipment?.id === shipment.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => {
                setSelectedShipment(shipment);
                setMapMode("detail");
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{shipment.productName}</p>
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
                      title="Tạo QR Code"
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
                      {shipment.totalCO2.toFixed(1)} kg CO₂e
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {shipment.carrier}
                    </span>
                  </div>
                </div>

                {/* View details button */}
                <Button
                  variant={
                    selectedShipment?.id === shipment.id ? "default" : "outline"
                  }
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShipment(shipment);
                    setMapMode("detail");
                  }}
                >
                  Xem chi tiết tuyến đường
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button onClick={onViewDetails} className="gap-2">
          Xem chi tiết theo dõi vận chuyển
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

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
