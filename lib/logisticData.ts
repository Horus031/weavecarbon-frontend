// Mock logistics data
export interface ShipmentLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface TransportLeg {
  id: string;
  legNumber: number;
  type: "domestic" | "international";
  mode: "truck_light" | "truck_heavy" | "ship" | "air" | "rail";
  origin: {
    name: string;
    lat: number;
    lng: number;
    type: "address" | "port" | "airport";
  };
  destination: {
    name: string;
    lat: number;
    lng: number;
    type: "address" | "port" | "airport";
  };
  distanceKm: number;
  emissionFactor: number;
  co2Kg: number;
  routeType: "road" | "sea" | "air";
}

export interface Shipment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  status: "in_transit" | "delivered" | "pending";
  progress: number;
  origin: string;
  destination: string;
  estimatedArrival: string;
  currentLocation: ShipmentLocation;
  legs: TransportLeg[];
  totalCO2: number;
  carrier: string;
}

// Demo route from Vietnam to Los Angeles
export const DEMO_VIETNAM_LA_ROUTE: TransportLeg[] = [
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

// Demo route from Vietnam to Tokyo
export const DEMO_VIETNAM_TOKYO_ROUTE: TransportLeg[] = [
  {
    id: "leg-jp-1",
    legNumber: 1,
    type: "domestic",
    mode: "truck_heavy",
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
    routeType: "road",
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
    distanceKm: 3200,
    emissionFactor: 0.602,
    co2Kg: 1926.4,
    routeType: "air",
  },
  {
    id: "leg-jp-3",
    legNumber: 3,
    type: "domestic",
    mode: "truck_light",
    origin: {
      name: "Sân bay Narita",
      lat: 35.7647,
      lng: 140.3864,
      type: "airport",
    },
    destination: {
      name: "Kho Tokyo",
      lat: 35.6895,
      lng: 139.6917,
      type: "address",
    },
    distanceKm: 70,
    emissionFactor: 0.089,
    co2Kg: 6.23,
    routeType: "road",
  },
];

// Demo route from Vietnam to Hamburg
export const DEMO_VIETNAM_EU_ROUTE: TransportLeg[] = [
  {
    id: "leg-eu-1",
    legNumber: 1,
    type: "domestic",
    mode: "truck_heavy",
    origin: {
      name: "Nhà máy Hải Phòng",
      lat: 20.8449,
      lng: 106.6881,
      type: "address",
    },
    destination: {
      name: "Cảng Hải Phòng",
      lat: 20.8449,
      lng: 106.6881,
      type: "port",
    },
    distanceKm: 15,
    emissionFactor: 0.105,
    co2Kg: 1.58,
    routeType: "road",
  },
  {
    id: "leg-eu-2",
    legNumber: 2,
    type: "international",
    mode: "ship",
    origin: {
      name: "Cảng Hải Phòng",
      lat: 20.8449,
      lng: 106.6881,
      type: "port",
    },
    destination: {
      name: "Cảng Hamburg",
      lat: 53.5511,
      lng: 9.9937,
      type: "port",
    },
    distanceKm: 16800,
    emissionFactor: 0.016,
    co2Kg: 268.8,
    routeType: "sea",
  },
  {
    id: "leg-eu-3",
    legNumber: 3,
    type: "domestic",
    mode: "truck_light",
    origin: {
      name: "Cảng Hamburg",
      lat: 53.5511,
      lng: 9.9937,
      type: "port",
    },
    destination: {
      name: "Kho Berlin",
      lat: 52.52,
      lng: 13.405,
      type: "address",
    },
    distanceKm: 290,
    emissionFactor: 0.089,
    co2Kg: 25.81,
    routeType: "road",
  },
];

// All shipments mock data
export const mockShipments: Shipment[] = [
  {
    id: "SHIP-2024-001",
    productId: "demo-product-001",
    productName: "Áo T-shirt Organic Cotton",
    sku: "DEMO-SKU-001",
    status: "in_transit",
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
    status: "delivered",
    progress: 100,
    origin: "Đà Nẵng, Vietnam",
    destination: "Tokyo, Japan",
    estimatedArrival: "2024-01-22",
    currentLocation: {
      lat: 35.7647,
      lng: 140.3864,
      name: "Tokyo, Japan - Đã giao",
    },
    legs: DEMO_VIETNAM_TOKYO_ROUTE,
    totalCO2: 1933.16,
    carrier: "ANA Cargo",
  },
  {
    id: "SHIP-2024-003",
    productId: "demo-product-002",
    productName: "Quần Jeans Recycled Denim",
    sku: "DEMO-SKU-002",
    status: "pending",
    progress: 0,
    origin: "Hải Phòng, Vietnam",
    destination: "Hamburg, Germany",
    estimatedArrival: "2024-03-05",
    currentLocation: {
      lat: 20.8449,
      lng: 106.6881,
      name: "Cảng Hải Phòng - Chờ xuất khẩu",
    },
    legs: DEMO_VIETNAM_EU_ROUTE,
    totalCO2: 296.19,
    carrier: "Maersk Line",
  },
];
