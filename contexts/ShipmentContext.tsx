"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  ProductAssessmentData,
  AddressInput,
} from "@/components/dashboard/assessment/types";

// ============= Types =============

export type ShipmentStatus =
  | "planned"
  | "in_transit"
  | "delivered"
  | "exception"
  | "archived";
export type StatusSource = "sla_estimate" | "carrier_api" | "manual_confirm";

export interface ShipmentLocation {
  name: string;
  lat: number;
  lng: number;
  type: "address" | "port" | "airport" | "warehouse";
}

export interface ShipmentLeg {
  id: string;
  legNumber: number;
  type: "domestic" | "international";
  mode: "road" | "sea" | "air" | "rail";
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  distanceKm: number;
  emissionFactor: number;
  co2Kg: number;
}

export interface Shipment {
  id: string;
  referenceNumber: string;

  // Linked entities
  productId?: string;
  batchId?: string;
  productIds?: string[];
  skuInstances?: string[];

  // Product info
  productName: string;
  sku: string;
  quantity: number;

  // Addresses
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  originAddress: AddressInput;
  destinationAddress: AddressInput;

  // Transport
  legs: ShipmentLeg[];
  totalDistanceKm: number;
  totalCO2: number;
  carrier?: string;
  trackingCode?: string;

  // Timing
  createdAt: string;
  updatedAt: string;
  shipStartTime?: string;
  etaPlanned: string;
  etaSource: "default_sla" | "carrier_api" | "manual";
  deliveredAt?: string;

  // Status
  status: ShipmentStatus;
  statusSource: StatusSource;
  progress: number;

  // Market
  destinationMarket: string;

  // Flags
  isDemo?: boolean;
  statusNote?: string;
}

export interface ShipmentStatusLog {
  id: string;
  shipmentId: string;
  previousStatus: ShipmentStatus;
  newStatus: ShipmentStatus;
  statusSource: StatusSource;
  timestamp: string;
  note?: string;
}

// ============= SLA Configuration =============

export interface SLAConfig {
  market: string;
  transportMode: "road" | "sea" | "air" | "rail";
  distanceBand?: string;
  minDays: number;
  maxDays: number;
}

export const SLA_CONFIG: SLAConfig[] = [
  // Vietnam Road
  {
    market: "vn",
    transportMode: "road",
    distanceBand: "0-50km",
    minDays: 1,
    maxDays: 2,
  },
  {
    market: "vn",
    transportMode: "road",
    distanceBand: "50-300km",
    minDays: 2,
    maxDays: 4,
  },
  {
    market: "vn",
    transportMode: "road",
    distanceBand: "300-800km",
    minDays: 3,
    maxDays: 6,
  },
  {
    market: "vn",
    transportMode: "road",
    distanceBand: ">800km",
    minDays: 5,
    maxDays: 9,
  },

  // International Air
  { market: "us", transportMode: "air", minDays: 5, maxDays: 10 },
  { market: "eu", transportMode: "air", minDays: 4, maxDays: 8 },
  { market: "jp", transportMode: "air", minDays: 3, maxDays: 6 },
  { market: "kr", transportMode: "air", minDays: 3, maxDays: 5 },
  { market: "other", transportMode: "air", minDays: 5, maxDays: 12 },

  // International Sea
  { market: "us", transportMode: "sea", minDays: 20, maxDays: 35 },
  { market: "eu", transportMode: "sea", minDays: 25, maxDays: 45 },
  { market: "jp", transportMode: "sea", minDays: 7, maxDays: 14 },
  { market: "kr", transportMode: "sea", minDays: 5, maxDays: 10 },
  { market: "other", transportMode: "sea", minDays: 15, maxDays: 30 },

  // Rail (domestic/regional)
  { market: "vn", transportMode: "rail", minDays: 2, maxDays: 5 },
  { market: "eu", transportMode: "rail", minDays: 7, maxDays: 15 },
];

// ============= Helpers =============

const generateShipmentId = () =>
  `SHIP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const calculateETAFromSLA = (
  market: string,
  transportMode: "road" | "sea" | "air" | "rail",
  distanceKm?: number,
): { etaDays: number; slaConfig: SLAConfig | null } => {
  // Find matching SLA config
  let config = SLA_CONFIG.find(
    (c) =>
      c.market === market.toLowerCase() && c.transportMode === transportMode,
  );

  // Handle road distance bands
  if (transportMode === "road" && distanceKm !== undefined) {
    let distanceBand = ">800km";
    if (distanceKm <= 50) distanceBand = "0-50km";
    else if (distanceKm <= 300) distanceBand = "50-300km";
    else if (distanceKm <= 800) distanceBand = "300-800km";

    config = SLA_CONFIG.find(
      (c) =>
        c.market === "vn" &&
        c.transportMode === "road" &&
        c.distanceBand === distanceBand,
    );
  }

  // Fallback to default if no config found
  if (!config) {
    config = SLA_CONFIG.find(
      (c) => c.market === "other" && c.transportMode === transportMode,
    );
  }

  if (!config) {
    return { etaDays: 14, slaConfig: null }; // Default fallback
  }

  // Use average of min and max
  const etaDays = Math.ceil((config.minDays + config.maxDays) / 2);
  return { etaDays, slaConfig: config };
};

const calculateStatusFromTime = (
  shipment: Shipment,
): { status: ShipmentStatus; progress: number; statusNote?: string } => {
  const now = new Date();
  const created = new Date(shipment.createdAt);
  const eta = new Date(shipment.etaPlanned);
  const shipStart = shipment.shipStartTime
    ? new Date(shipment.shipStartTime)
    : created;

  // Buffer is 20% of total time or 3 days, whichever is larger
  const totalDays =
    (eta.getTime() - shipStart.getTime()) / (1000 * 60 * 60 * 24);
  const bufferDays = Math.max(totalDays * 0.2, 3);
  const exceptionDate = new Date(
    eta.getTime() + bufferDays * 24 * 60 * 60 * 1000,
  );

  if (now < shipStart) {
    return { status: "planned", progress: 0 };
  }

  if (now >= eta) {
    if (now >= exceptionDate && shipment.statusSource !== "carrier_api") {
      return {
        status: "exception",
        progress: 100,
        statusNote: "Quá hạn theo ước tính SLA",
      };
    }
    return { status: "delivered", progress: 100 };
  }

  // Calculate progress
  const elapsed = now.getTime() - shipStart.getTime();
  const total = eta.getTime() - shipStart.getTime();
  const progress = Math.min(Math.round((elapsed / total) * 100), 99);

  return { status: "in_transit", progress };
};

// Geocode helper (simplified - returns approximate coordinates)
const getApproximateCoordinates = (
  address: AddressInput,
): { lat: number; lng: number } => {
  // City-based approximate coordinates
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    "ho chi minh": { lat: 10.7769, lng: 106.7009 },
    hcm: { lat: 10.7769, lng: 106.7009 },
    "tp.hcm": { lat: 10.7769, lng: 106.7009 },
    "ha noi": { lat: 21.0285, lng: 105.8542 },
    hanoi: { lat: 21.0285, lng: 105.8542 },
    "da nang": { lat: 16.0544, lng: 108.2022 },
    "binh duong": { lat: 10.9808, lng: 106.6333 },
    "dong nai": { lat: 10.9574, lng: 106.8426 },
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    "new york": { lat: 40.7128, lng: -74.006 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    seoul: { lat: 37.5665, lng: 126.978 },
    rotterdam: { lat: 51.9244, lng: 4.4777 },
    hamburg: { lat: 53.5511, lng: 9.9937 },
    london: { lat: 51.5074, lng: -0.1278 },
    paris: { lat: 48.8566, lng: 2.3522 },
  };

  const cityLower = address.city?.toLowerCase() || "";
  const match = Object.entries(cityCoords).find(([key]) =>
    cityLower.includes(key),
  );

  if (match) return match[1];

  // Country-based fallback
  const countryCoords: Record<string, { lat: number; lng: number }> = {
    vietnam: { lat: 14.0583, lng: 108.2772 },
    usa: { lat: 37.0902, lng: -95.7129 },
    "united states": { lat: 37.0902, lng: -95.7129 },
    japan: { lat: 36.2048, lng: 138.2529 },
    "south korea": { lat: 35.9078, lng: 127.7669 },
    korea: { lat: 35.9078, lng: 127.7669 },
    netherlands: { lat: 52.1326, lng: 5.2913 },
    germany: { lat: 51.1657, lng: 10.4515 },
    france: { lat: 46.2276, lng: 2.2137 },
    uk: { lat: 55.3781, lng: -3.436 },
  };

  const countryLower = address.country?.toLowerCase() || "";
  const countryMatch = Object.entries(countryCoords).find(([key]) =>
    countryLower.includes(key),
  );

  return countryMatch ? countryMatch[1] : { lat: 10.7769, lng: 106.7009 };
};

// Emission factors per km
const EMISSION_FACTORS: Record<string, number> = {
  road: 0.089,
  sea: 0.016,
  air: 0.602,
  rail: 0.028,
};

// ============= Demo Data =============

const generateDemoShipments = (): Shipment[] => {
  const now = new Date();

  return [
    {
      id: "SHIP-2024-001",
      referenceNumber: "REF-VN-US-001",
      productId: "demo-product-001",
      productName: "Áo T-shirt Organic Cotton",
      sku: "DEMO-SKU-001",
      quantity: 500,
      origin: {
        name: "Nhà máy Bình Dương",
        lat: 10.9808,
        lng: 106.6333,
        type: "address",
      },
      destination: {
        name: "Kho LA Distribution",
        lat: 34.0522,
        lng: -118.2437,
        type: "warehouse",
      },
      originAddress: {
        streetNumber: "123",
        street: "Đại lộ Bình Dương",
        ward: "",
        district: "Thuận An",
        city: "Bình Dương",
        stateRegion: "",
        country: "Vietnam",
        postalCode: "75000",
      },
      destinationAddress: {
        streetNumber: "456",
        street: "Harbor Blvd",
        ward: "",
        district: "",
        city: "Los Angeles",
        stateRegion: "California",
        country: "USA",
        postalCode: "90001",
      },
      legs: [
        {
          id: "leg-1",
          legNumber: 1,
          type: "domestic",
          mode: "road",
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
        },
        {
          id: "leg-2",
          legNumber: 2,
          type: "international",
          mode: "sea",
          origin: {
            name: "Cảng Cát Lái",
            lat: 10.7531,
            lng: 106.7567,
            type: "port",
          },
          destination: {
            name: "Cảng Los Angeles",
            lat: 33.7361,
            lng: -118.2631,
            type: "port",
          },
          distanceKm: 14500,
          emissionFactor: 0.016,
          co2Kg: 232.0,
        },
        {
          id: "leg-3",
          legNumber: 3,
          type: "domestic",
          mode: "road",
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
            type: "warehouse",
          },
          distanceKm: 45,
          emissionFactor: 0.089,
          co2Kg: 4.01,
        },
      ],
      totalDistanceKm: 14580,
      totalCO2: 239.69,
      carrier: "COSCO Shipping",
      trackingCode: "COSCO123456789",
      createdAt: new Date(
        now.getTime() - 15 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: now.toISOString(),
      shipStartTime: new Date(
        now.getTime() - 14 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaPlanned: new Date(
        now.getTime() + 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaSource: "default_sla",
      status: "in_transit",
      statusSource: "sla_estimate",
      progress: 65,
      destinationMarket: "us",
      isDemo: true,
    },
    {
      id: "SHIP-2024-002",
      referenceNumber: "REF-VN-JP-002",
      productId: "demo-product-003",
      productName: "Váy Linen Blend",
      sku: "DEMO-SKU-003",
      quantity: 200,
      origin: {
        name: "Nhà máy Đà Nẵng",
        lat: 16.0544,
        lng: 108.2022,
        type: "address",
      },
      destination: {
        name: "Tokyo Warehouse",
        lat: 35.7647,
        lng: 140.3864,
        type: "warehouse",
      },
      originAddress: {
        streetNumber: "88",
        street: "Nguyễn Văn Linh",
        ward: "",
        district: "Hải Châu",
        city: "Đà Nẵng",
        stateRegion: "",
        country: "Vietnam",
        postalCode: "550000",
      },
      destinationAddress: {
        streetNumber: "1-1-1",
        street: "Marunouchi",
        ward: "",
        district: "Chiyoda",
        city: "Tokyo",
        stateRegion: "",
        country: "Japan",
        postalCode: "100-0005",
      },
      legs: [
        {
          id: "leg-jp-1",
          legNumber: 1,
          type: "domestic",
          mode: "road",
          origin: {
            name: "Nhà máy Đà Nẵng",
            lat: 16.0544,
            lng: 108.2022,
            type: "address",
          },
          destination: {
            name: "Sân bay Đà Nẵng",
            lat: 16.0439,
            lng: 108.1997,
            type: "airport",
          },
          distanceKm: 5,
          emissionFactor: 0.105,
          co2Kg: 0.53,
        },
        {
          id: "leg-jp-2",
          legNumber: 2,
          type: "international",
          mode: "air",
          origin: {
            name: "Sân bay Đà Nẵng",
            lat: 16.0439,
            lng: 108.1997,
            type: "airport",
          },
          destination: {
            name: "Sân bay Narita",
            lat: 35.7647,
            lng: 140.3864,
            type: "airport",
          },
          distanceKm: 3850,
          emissionFactor: 0.602,
          co2Kg: 2317.7,
        },
      ],
      totalDistanceKm: 3855,
      totalCO2: 2318.23,
      carrier: "Vietnam Airlines Cargo",
      trackingCode: "VN987654321",
      createdAt: new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: now.toISOString(),
      shipStartTime: new Date(
        now.getTime() - 28 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaPlanned: new Date(
        now.getTime() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaSource: "default_sla",
      deliveredAt: new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "delivered",
      statusSource: "sla_estimate",
      progress: 100,
      destinationMarket: "jp",
      isDemo: true,
    },
    {
      id: "SHIP-2024-003",
      referenceNumber: "REF-VN-EU-003",
      productId: "demo-product-002",
      productName: "Quần Jeans Recycled Denim",
      sku: "DEMO-SKU-002",
      quantity: 300,
      origin: {
        name: "Nhà máy Q.12, TP.HCM",
        lat: 10.8675,
        lng: 106.6417,
        type: "address",
      },
      destination: {
        name: "Rotterdam Distribution Center",
        lat: 51.9244,
        lng: 4.4777,
        type: "warehouse",
      },
      originAddress: {
        streetNumber: "789",
        street: "Quốc lộ 1A",
        ward: "",
        district: "Quận 12",
        city: "TP.HCM",
        stateRegion: "",
        country: "Vietnam",
        postalCode: "700000",
      },
      destinationAddress: {
        streetNumber: "100",
        street: "Europaweg",
        ward: "",
        district: "",
        city: "Rotterdam",
        stateRegion: "South Holland",
        country: "Netherlands",
        postalCode: "3199 LC",
      },
      legs: [
        {
          id: "leg-eu-1",
          legNumber: 1,
          type: "domestic",
          mode: "road",
          origin: {
            name: "Nhà máy Q.12, TP.HCM",
            lat: 10.8675,
            lng: 106.6417,
            type: "address",
          },
          destination: {
            name: "Cảng Cát Lái, TP.HCM",
            lat: 10.7531,
            lng: 106.7567,
            type: "port",
          },
          distanceKm: 28,
          emissionFactor: 0.089,
          co2Kg: 2.49,
        },
        {
          id: "leg-eu-2",
          legNumber: 2,
          type: "international",
          mode: "sea",
          origin: {
            name: "Cảng Cát Lái, TP.HCM",
            lat: 10.7531,
            lng: 106.7567,
            type: "port",
          },
          destination: {
            name: "Cảng Rotterdam",
            lat: 51.9244,
            lng: 4.4777,
            type: "port",
          },
          distanceKm: 17200,
          emissionFactor: 0.016,
          co2Kg: 275.2,
        },
      ],
      totalDistanceKm: 17228,
      totalCO2: 277.69,
      carrier: "Maersk Line",
      createdAt: new Date(
        now.getTime() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: now.toISOString(),
      shipStartTime: new Date(
        now.getTime() + 1 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaPlanned: new Date(
        now.getTime() + 35 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      etaSource: "default_sla",
      status: "planned",
      statusSource: "sla_estimate",
      progress: 0,
      destinationMarket: "eu",
      isDemo: true,
    },
  ];
};

// ============= Context =============

interface ShipmentContextType {
  shipments: Shipment[];
  statusLogs: ShipmentStatusLog[];

  // CRUD
  createShipmentFromProduct: (
    productData: ProductAssessmentData,
    productId: string,
  ) => Shipment;
  createShipmentFromBatch: (
    batchId: string,
    products: ProductAssessmentData[],
    productIds: string[],
  ) => Shipment;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  deleteShipment: (id: string) => void;

  // Status
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    source: StatusSource,
    note?: string,
  ) => void;
  confirmDelivered: (id: string) => void;
  refreshAllStatuses: () => void;

  // Query
  getShipment: (id: string) => Shipment | undefined;
  getShipmentsByStatus: (
    status: ShipmentStatus | "all" | "active" | "history",
  ) => Shipment[];
  searchShipments: (query: string) => Shipment[];
  getShipmentByProduct: (productId: string) => Shipment | undefined;
  getShipmentByBatch: (batchId: string) => Shipment | undefined;

  // Filters
  filterShipments: (filters: ShipmentFilters) => Shipment[];
}

export interface ShipmentFilters {
  status?: ShipmentStatus | "all" | "active" | "history";
  market?: string;
  transportMode?: string;
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(
  undefined,
);

export const ShipmentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [shipments, setShipments] = useState<Shipment[]>(
    generateDemoShipments(),
  );
  const [statusLogs, setStatusLogs] = useState<ShipmentStatusLog[]>([]);

  // Create shipment from product assessment data
  const createShipmentFromProduct = useCallback(
    (productData: ProductAssessmentData, productId: string): Shipment => {
      const originCoords = getApproximateCoordinates(productData.originAddress);
      const destCoords = getApproximateCoordinates(
        productData.destinationAddress,
      );

      // Determine primary transport mode
      const primaryLeg = productData.transportLegs?.[0];
      const primaryMode = primaryLeg?.mode || "sea";

      // Calculate ETA
      const { etaDays } = calculateETAFromSLA(
        productData.destinationMarket || "other",
        primaryMode as "road" | "sea" | "air" | "rail",
        productData.estimatedTotalDistance,
      );

      const now = new Date();
      const shipStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
      const etaPlanned = new Date(
        shipStartTime.getTime() + etaDays * 24 * 60 * 60 * 1000,
      );

      // Calculate CO2 from legs or estimate
      let totalCO2 = 0;
      const legs: ShipmentLeg[] = (productData.transportLegs || []).map(
        (leg, index) => {
          const emissionFactor = EMISSION_FACTORS[leg.mode] || 0.05;
          const legDistance = leg.estimatedDistance || 1000;
          const co2Kg =
            legDistance *
            emissionFactor *
            ((productData.weightPerUnit * productData.quantity) / 1000);
          totalCO2 += co2Kg;

          return {
            id: `leg-${Date.now()}-${index}`,
            legNumber: index + 1,
            type: index === 0 ? "domestic" : "international",
            mode: leg.mode,
            origin: {
              name: productData.originAddress.city || "Origin",
              lat: index === 0 ? originCoords.lat : destCoords.lat - 10,
              lng: index === 0 ? originCoords.lng : destCoords.lng - 10,
              type:
                leg.mode === "sea"
                  ? "port"
                  : leg.mode === "air"
                    ? "airport"
                    : "address",
            },
            destination: {
              name: productData.destinationAddress.city || "Destination",
              lat: destCoords.lat,
              lng: destCoords.lng,
              type:
                leg.mode === "sea"
                  ? "port"
                  : leg.mode === "air"
                    ? "airport"
                    : "warehouse",
            },
            distanceKm: legDistance,
            emissionFactor: emissionFactor,
            co2Kg,
          };
        },
      );

      // If no legs provided, create a simple direct leg
      if (legs.length === 0) {
        const estimatedDistance = productData.estimatedTotalDistance || 5000;
        const emissionFactor = EMISSION_FACTORS[primaryMode] || 0.05;
        const co2Kg =
          estimatedDistance *
          emissionFactor *
          ((productData.weightPerUnit * productData.quantity) / 1000);
        totalCO2 = co2Kg;

        legs.push({
          id: `leg-${Date.now()}-0`,
          legNumber: 1,
          type: "international",
          mode: primaryMode as "road" | "sea" | "air" | "rail",
          origin: {
            name: productData.originAddress.city || "Vietnam",
            lat: originCoords.lat,
            lng: originCoords.lng,
            type: "address",
          },
          destination: {
            name: productData.destinationAddress.city || "Destination",
            lat: destCoords.lat,
            lng: destCoords.lng,
            type: "warehouse",
          },
          distanceKm: estimatedDistance,
          emissionFactor,
          co2Kg,
        });
      }

      const newShipment: Shipment = {
        id: generateShipmentId(),
        referenceNumber: `REF-${productData.productCode}-${Date.now().toString().slice(-4)}`,
        productId,
        productName: productData.productName,
        sku: productData.productCode,
        quantity: productData.quantity,
        origin: legs[0].origin,
        destination: legs[legs.length - 1].destination,
        originAddress: productData.originAddress,
        destinationAddress: productData.destinationAddress,
        legs,
        totalDistanceKm: legs.reduce((sum, leg) => sum + leg.distanceKm, 0),
        totalCO2,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        shipStartTime: shipStartTime.toISOString(),
        etaPlanned: etaPlanned.toISOString(),
        etaSource: "default_sla",
        status: "planned",
        statusSource: "sla_estimate",
        progress: 0,
        destinationMarket: productData.destinationMarket || "other",
        statusNote:
          "Trạng thái ước tính theo SLA - Không phải trạng thái vận chuyển thực tế",
      };

      setShipments((prev) => [newShipment, ...prev]);

      // Log creation
      setStatusLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          shipmentId: newShipment.id,
          previousStatus: "planned",
          newStatus: "planned",
          statusSource: "sla_estimate",
          timestamp: now.toISOString(),
          note: "Tạo vận đơn tự động sau Publish sản phẩm",
        },
      ]);

      return newShipment;
    },
    [],
  );

  // Create shipment from batch
  const createShipmentFromBatch = useCallback(
    (
      batchId: string,
      products: ProductAssessmentData[],
      productIds: string[],
    ): Shipment => {
      // Use first product's logistics data as base
      const firstProduct = products[0];
      if (!firstProduct) throw new Error("No products in batch");

      const shipment = createShipmentFromProduct(firstProduct, productIds[0]);

      // Update with batch info
      const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                batchId,
                productIds,
                quantity: totalQuantity,
                productName: `Lô hàng ${batchId} (${products.length} SKU)`,
              }
            : s,
        ),
      );

      return shipment;
    },
    [createShipmentFromProduct],
  );

  // Update shipment
  const updateShipment = useCallback(
    (id: string, updates: Partial<Shipment>) => {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s,
        ),
      );
    },
    [],
  );

  // Delete shipment
  const deleteShipment = useCallback((id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Update status
  const updateShipmentStatus = useCallback(
    (
      id: string,
      status: ShipmentStatus,
      source: StatusSource,
      note?: string,
    ) => {
      const shipment = shipments.find((s) => s.id === id);
      if (!shipment) return;

      const now = new Date().toISOString();

      // Log the change
      setStatusLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          shipmentId: id,
          previousStatus: shipment.status,
          newStatus: status,
          statusSource: source,
          timestamp: now,
          note,
        },
      ]);

      // Update shipment
      setShipments((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                statusSource: source,
                statusNote: note,
                updatedAt: now,
                progress:
                  status === "delivered"
                    ? 100
                    : status === "planned"
                      ? 0
                      : s.progress,
                deliveredAt: status === "delivered" ? now : s.deliveredAt,
              }
            : s,
        ),
      );
    },
    [shipments],
  );

  // Confirm delivered manually
  const confirmDelivered = useCallback(
    (id: string) => {
      updateShipmentStatus(
        id,
        "delivered",
        "manual_confirm",
        "Xác nhận giao hàng thủ công",
      );
    },
    [updateShipmentStatus],
  );

  // Refresh all statuses based on time
  const refreshAllStatuses = useCallback(() => {
    setShipments((prev) =>
      prev.map((shipment) => {
        // Skip if manually confirmed or from carrier API
        if (
          shipment.statusSource === "manual_confirm" ||
          shipment.statusSource === "carrier_api"
        ) {
          return shipment;
        }

        // Skip archived
        if (shipment.status === "archived") return shipment;

        const { status, progress, statusNote } =
          calculateStatusFromTime(shipment);

        // Only update if status changed
        if (status !== shipment.status || progress !== shipment.progress) {
          return {
            ...shipment,
            status,
            progress,
            statusNote: statusNote || shipment.statusNote,
            updatedAt: new Date().toISOString(),
            deliveredAt:
              status === "delivered" && !shipment.deliveredAt
                ? new Date().toISOString()
                : shipment.deliveredAt,
          };
        }

        return shipment;
      }),
    );
  }, []);

  // Query functions
  const getShipment = useCallback(
    (id: string) => {
      return shipments.find((s) => s.id === id);
    },
    [shipments],
  );

  const getShipmentsByStatus = useCallback(
    (status: ShipmentStatus | "all" | "active" | "history") => {
      if (status === "all") return shipments;
      if (status === "active")
        return shipments.filter((s) =>
          ["planned", "in_transit", "exception"].includes(s.status),
        );
      if (status === "history")
        return shipments.filter((s) =>
          ["delivered", "archived"].includes(s.status),
        );
      return shipments.filter((s) => s.status === status);
    },
    [shipments],
  );

  const searchShipments = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return shipments.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.referenceNumber.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.trackingCode?.toLowerCase().includes(q) ||
          s.carrier?.toLowerCase().includes(q),
      );
    },
    [shipments],
  );

  const getShipmentByProduct = useCallback(
    (productId: string) => {
      return shipments.find((s) => s.productId === productId);
    },
    [shipments],
  );

  const getShipmentByBatch = useCallback(
    (batchId: string) => {
      return shipments.find((s) => s.batchId === batchId);
    },
    [shipments],
  );

  // Filter shipments
  const filterShipments = useCallback(
    (filters: ShipmentFilters) => {
      let result = [...shipments];

      // Status filter
      if (filters.status && filters.status !== "all") {
        if (filters.status === "active") {
          result = result.filter((s) =>
            ["planned", "in_transit", "exception"].includes(s.status),
          );
        } else if (filters.status === "history") {
          result = result.filter((s) =>
            ["delivered", "archived"].includes(s.status),
          );
        } else {
          result = result.filter((s) => s.status === filters.status);
        }
      }

      // Market filter
      if (filters.market && filters.market !== "all") {
        result = result.filter((s) => s.destinationMarket === filters.market);
      }

      // Transport mode filter
      if (filters.transportMode && filters.transportMode !== "all") {
        result = result.filter((s) =>
          s.legs.some((leg) => leg.mode === filters.transportMode),
        );
      }

      // Date range filter
      if (filters.dateRange) {
        result = result.filter((s) => {
          const created = new Date(s.createdAt);
          return (
            created >= filters.dateRange!.start &&
            created <= filters.dateRange!.end
          );
        });
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
          (s) =>
            s.id.toLowerCase().includes(q) ||
            s.referenceNumber.toLowerCase().includes(q) ||
            s.sku.toLowerCase().includes(q) ||
            s.productName.toLowerCase().includes(q) ||
            s.trackingCode?.toLowerCase().includes(q),
        );
      }

      return result;
    },
    [shipments],
  );

  return (
    <ShipmentContext.Provider
      value={{
        shipments,
        statusLogs,
        createShipmentFromProduct,
        createShipmentFromBatch,
        updateShipment,
        deleteShipment,
        updateShipmentStatus,
        confirmDelivered,
        refreshAllStatuses,
        getShipment,
        getShipmentsByStatus,
        searchShipments,
        getShipmentByProduct,
        getShipmentByBatch,
        filterShipments,
      }}
    >
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error("useShipments must be used within a ShipmentProvider");
  }
  return context;
};
