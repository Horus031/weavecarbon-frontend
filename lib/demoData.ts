// Demo data for B2B product assessment flow
// DO NOT MODIFY - Demo data for learning and demonstration purposes

export interface ProductData {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  description: string;
  weight: string;
  unit: string;
  primaryMaterial: string;
  materialPercentage: string;
  secondaryMaterial: string;
  secondaryPercentage: string;
  recycledContent: string;
  certifications: string[];
  manufacturingLocation: string;
  energySource: string;
  processType: string;
  wasteRecovery: string;
  originCountry: string;
  destinationMarket: string;
  transportMode: string;
  packagingType: string;
  packagingWeight: string;
  sourceType: "documented" | "proxy";
  confidenceLevel: number;
  isDemo: boolean;
  createdAt: string;
  createdBy: string;
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

export interface TransportData {
  id: string;
  productId: string;
  legs: TransportLeg[];
  totalDistanceKm: number;
  totalCO2Kg: number;
  confidenceLevel: number;
  isDemo: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CalculationHistory {
  id: string;
  productId: string;
  productName: string;
  transportId: string;
  materialsCO2: number;
  manufacturingCO2: number;
  transportCO2: number;
  packagingCO2: number;
  totalCO2: number;
  carbonVersion: string;
  isDemo: boolean;
  createdAt: string;
  createdBy: string;
}

// Demo products - READ ONLY
export const DEMO_PRODUCTS: ProductData[] = [
  {
    id: "demo-product-001",
    productName: "Áo T-shirt Organic Cotton",
    productCode: "DEMO-SKU-001",
    category: "apparel",
    description: "Áo thun cotton hữu cơ 100%, sản xuất tại Việt Nam",
    weight: "0.25",
    unit: "kg",
    primaryMaterial: "organic_cotton",
    materialPercentage: "100",
    secondaryMaterial: "",
    secondaryPercentage: "",
    recycledContent: "0",
    certifications: ["gots", "oeko_tex"],
    manufacturingLocation: "TP. Hồ Chí Minh, Vietnam",
    energySource: "solar",
    processType: "cutting_sewing",
    wasteRecovery: "partial",
    originCountry: "Vietnam",
    destinationMarket: "eu",
    transportMode: "sea",
    packagingType: "recycled_paper",
    packagingWeight: "0.02",
    sourceType: "documented",
    confidenceLevel: 92,
    isDemo: true,
    createdAt: "2024-01-15T10:30:00Z",
    createdBy: "demo@weavecarbon.com",
  },
  {
    id: "demo-product-002",
    productName: "Quần Jeans Recycled Denim",
    productCode: "DEMO-SKU-002",
    category: "apparel",
    description: "Quần jeans từ vải denim tái chế 60%",
    weight: "0.45",
    unit: "kg",
    primaryMaterial: "recycled_polyester",
    materialPercentage: "60",
    secondaryMaterial: "cotton",
    secondaryPercentage: "40",
    recycledContent: "60",
    certifications: ["grs"],
    manufacturingLocation: "Bình Dương, Vietnam",
    energySource: "mixed",
    processType: "full_package",
    wasteRecovery: "full",
    originCountry: "Vietnam",
    destinationMarket: "us",
    transportMode: "sea",
    packagingType: "recycled_paper",
    packagingWeight: "0.03",
    sourceType: "documented",
    confidenceLevel: 88,
    isDemo: true,
    createdAt: "2024-01-18T14:45:00Z",
    createdBy: "demo@weavecarbon.com",
  },
  {
    id: "demo-product-003",
    productName: "Váy Linen Blend",
    productCode: "DEMO-SKU-003",
    category: "apparel",
    description: "Váy từ vải lanh pha cotton, phù hợp xuất khẩu Nhật Bản",
    weight: "0.30",
    unit: "kg",
    primaryMaterial: "linen",
    materialPercentage: "70",
    secondaryMaterial: "cotton",
    secondaryPercentage: "30",
    recycledContent: "0",
    certifications: ["oeko_tex"],
    manufacturingLocation: "Đà Nẵng, Vietnam",
    energySource: "grid",
    processType: "weaving",
    wasteRecovery: "partial",
    originCountry: "Vietnam",
    destinationMarket: "jp",
    transportMode: "air",
    packagingType: "standard",
    packagingWeight: "0.02",
    sourceType: "proxy",
    confidenceLevel: 75,
    isDemo: true,
    createdAt: "2024-01-20T09:15:00Z",
    createdBy: "demo@weavecarbon.com",
  },
];

// Demo transport routes - READ ONLY
export const DEMO_TRANSPORTS: TransportData[] = [
  {
    id: "demo-transport-001",
    productId: "demo-product-001",
    legs: [
      {
        id: "leg-001-1",
        legNumber: 1,
        type: "domestic",
        mode: "truck_light",
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
        routeType: "road",
      },
      {
        id: "leg-001-2",
        legNumber: 2,
        type: "international",
        mode: "ship",
        origin: {
          name: "Cảng Cát Lái, TP.HCM",
          lat: 10.7531,
          lng: 106.7567,
          type: "port",
        },
        destination: {
          name: "Cảng Rotterdam, Hà Lan",
          lat: 51.9244,
          lng: 4.4777,
          type: "port",
        },
        distanceKm: 17200,
        emissionFactor: 0.016,
        co2Kg: 275.2,
        routeType: "sea",
      },
    ],
    totalDistanceKm: 17228,
    totalCO2Kg: 277.69,
    confidenceLevel: 95,
    isDemo: true,
    createdAt: "2024-01-15T11:00:00Z",
    createdBy: "demo@weavecarbon.com",
  },
  {
    id: "demo-transport-002",
    productId: "demo-product-003",
    legs: [
      {
        id: "leg-002-1",
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
        id: "leg-002-2",
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
          name: "Sân bay Narita, Tokyo",
          lat: 35.7647,
          lng: 140.3864,
          type: "airport",
        },
        distanceKm: 3850,
        emissionFactor: 0.602,
        co2Kg: 2317.7,
        routeType: "air",
      },
    ],
    totalDistanceKm: 3855,
    totalCO2Kg: 2318.23,
    confidenceLevel: 90,
    isDemo: true,
    createdAt: "2024-01-20T10:00:00Z",
    createdBy: "demo@weavecarbon.com",
  },
];

// Demo calculation history - READ ONLY
export const DEMO_HISTORY: CalculationHistory[] = [
  {
    id: "demo-calc-001",
    productId: "demo-product-001",
    productName: "Áo T-shirt Organic Cotton",
    transportId: "demo-transport-001",
    materialsCO2: 1.85,
    manufacturingCO2: 0.95,
    transportCO2: 277.69,
    packagingCO2: 0.12,
    totalCO2: 280.61,
    carbonVersion: "v2024.1-DEFRA",
    isDemo: true,
    createdAt: "2024-01-15T11:30:00Z",
    createdBy: "demo@weavecarbon.com",
  },
  {
    id: "demo-calc-002",
    productId: "demo-product-002",
    productName: "Quần Jeans Recycled Denim",
    transportId: "",
    materialsCO2: 2.45,
    manufacturingCO2: 1.85,
    transportCO2: 0,
    packagingCO2: 0.18,
    totalCO2: 4.48,
    carbonVersion: "v2024.1-DEFRA",
    isDemo: true,
    createdAt: "2024-01-18T15:00:00Z",
    createdBy: "demo@weavecarbon.com",
  },
  {
    id: "demo-calc-003",
    productId: "demo-product-003",
    productName: "Váy Linen Blend",
    transportId: "demo-transport-002",
    materialsCO2: 1.65,
    manufacturingCO2: 1.25,
    transportCO2: 2318.23,
    packagingCO2: 0.1,
    totalCO2: 2321.23,
    carbonVersion: "v2024.1-DEFRA",
    isDemo: true,
    createdAt: "2024-01-20T10:30:00Z",
    createdBy: "demo@weavecarbon.com",
  },
];

// Emission factors (kg CO2e per km)
export const EMISSION_FACTORS = {
  truck_light: 0.089, // Van/light truck
  truck_heavy: 0.105, // Heavy goods vehicle
  ship: 0.016, // Container ship
  air: 0.602, // Air freight
  rail: 0.028, // Rail freight
};

// Labels for UI
export const TRANSPORT_MODE_LABELS: Record<string, string> = {
  truck_light: "Xe tải nhẹ",
  truck_heavy: "Xe tải nặng",
  ship: "Tàu biển",
  air: "Máy bay",
  rail: "Đường sắt",
};

export const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Quần áo",
  footwear: "Giày dép",
  accessories: "Phụ kiện",
  textiles: "Vải textile",
  homegoods: "Đồ gia dụng",
};

export const MATERIAL_LABELS: Record<string, string> = {
  cotton: "Cotton",
  polyester: "Polyester",
  wool: "Wool",
  silk: "Silk",
  linen: "Linen",
  nylon: "Nylon",
  recycled_polyester: "Recycled Polyester",
  organic_cotton: "Organic Cotton",
  bamboo: "Bamboo",
  hemp: "Hemp",
};

export const CERTIFICATION_LABELS: Record<string, string> = {
  gots: "GOTS",
  oeko_tex: "OEKO-TEX",
  grs: "GRS",
  bci: "BCI Cotton",
  fsc: "FSC",
};

export const MARKET_LABELS: Record<string, string> = {
  eu: "Châu Âu (EU)",
  us: "Hoa Kỳ",
  jp: "Nhật Bản",
  kr: "Hàn Quốc",
  domestic: "Nội địa Việt Nam",
};
