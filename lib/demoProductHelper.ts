import { DEMO_PRODUCTS, ProductData, DEMO_TRANSPORTS, ProductStatus } from "./demoData";
import { ProductAssessmentData, MaterialInput, EnergySourceInput, TransportLeg } from "@/components/dashboard/assessment/steps/types";

// Transform demo product data to ProductAssessmentData format
export function transformDemoProductToStoredProduct(demoProduct: ProductData): ProductAssessmentData & {
  id: string;
  createdAt: string;
  updatedAt: string;
} {
  // Find associated transport data
  const transportData = DEMO_TRANSPORTS.find(t => t.productId === demoProduct.id);
  
  // Extract materials
  const materials: MaterialInput[] = [];
  if (demoProduct.primaryMaterial) {
    materials.push({
      id: "mat-1",
      materialType: demoProduct.primaryMaterial,
      percentage: parseFloat(demoProduct.materialPercentage) || 100,
      source: "imported",
      certifications: demoProduct.certifications || [],
    });
  }
  if (demoProduct.secondaryMaterial) {
    materials.push({
      id: "mat-2",
      materialType: demoProduct.secondaryMaterial,
      percentage: parseFloat(demoProduct.secondaryPercentage) || 0,
      source: "imported",
      certifications: [],
    });
  }

  // Energy sources
  const energySources: EnergySourceInput[] = [
    {
      id: "energy-1",
      source: demoProduct.energySource || "grid",
      percentage: 100,
    },
  ];

  // Transport legs from demo data
  const transportLegs: TransportLeg[] = transportData?.legs.map((leg, index) => ({
    id: `leg-${index + 1}`,
    mode: leg.mode === "truck_light" || leg.mode === "truck_heavy" 
      ? "road" 
      : leg.mode === "ship" 
      ? "sea" 
      : leg.routeType as "road" | "sea" | "air" | "rail",
    estimatedDistance: leg.distanceKm,
  })) || [];

  // Calculate carbon results based on demo data
  const weight = parseFloat(demoProduct.weight) || 0.25;
  
  // Materials emissions (kg CO2e per kg of material)
  const materialCO2Factors: Record<string, number> = {
    organic_cotton: 4.5,
    cotton: 8.0,
    recycled_polyester: 2.5,
    polyester: 5.5,
    linen: 5.2,
    wool: 10.1,
    silk: 7.5,
    nylon: 6.8,
  };
  
  const materialsCO2 = materials.reduce((sum, mat) => {
    const factor = materialCO2Factors[mat.materialType] || 6.0;
    return sum + (factor * weight * (mat.percentage / 100));
  }, 0);

  // Production emissions (rough estimate based on process type)
  const productionCO2 = weight * 1.5; // ~1.5 kg CO2e per kg for production

  // Energy emissions
  const energyCO2 = weight * 0.8; // ~0.8 kg CO2e per kg for energy

  // Transport emissions from demo data or estimate
  const transportCO2 = transportData ? transportData.totalCO2Kg / 1000 : weight * 0.5;

  const totalCO2 = materialsCO2 + productionCO2 + energyCO2 + transportCO2;

  // Map demo product status to stored product status
  const mappedStatus: "draft" | "published" = 
    demoProduct.status === "published" ? "published" : "draft";

  return {
    id: demoProduct.id,
    productCode: demoProduct.productCode,
    productName: demoProduct.productName,
    productType: demoProduct.category,
    weightPerUnit: weight * 1000, // convert to grams
    quantity: 1000,
    materials,
    accessories: [],
    productionProcesses: [demoProduct.processType || "cutting_sewing"],
    energySources,
    manufacturingLocation: demoProduct.manufacturingLocation,
    wasteRecovery: demoProduct.wasteRecovery || "partial",
    destinationMarket: demoProduct.destinationMarket,
    originAddress: {
      streetNumber: "",
      street: "",
      ward: "",
      district: "",
      city: demoProduct.manufacturingLocation.split(",")[0] || "Ho Chi Minh",
      stateRegion: "",
      country: demoProduct.originCountry,
      postalCode: "",
      lat: 10.8231,
      lng: 106.6297,
    },
    destinationAddress: {
      streetNumber: "",
      street: "",
      ward: "",
      district: "",
      city: "Destination City",
      stateRegion: "",
      country: demoProduct.destinationMarket.toUpperCase(),
      postalCode: "",
    },
    transportLegs,
    estimatedTotalDistance: transportData?.totalDistanceKm || 10000,
    carbonResults: {
      perProduct: {
        materials: materialsCO2,
        production: productionCO2,
        energy: energyCO2,
        transport: transportCO2,
        total: totalCO2,
      },
      totalBatch: {
        materials: materialsCO2 * 1000,
        production: productionCO2 * 1000,
        energy: energyCO2 * 1000,
        transport: transportCO2 * 1000,
        total: totalCO2 * 1000,
      },
      confidenceLevel: demoProduct.confidenceLevel >= 85 ? "high" : demoProduct.confidenceLevel >= 70 ? "medium" : "low",
      proxyUsed: demoProduct.sourceType === "proxy",
      proxyNotes: demoProduct.sourceType === "proxy" ? ["Using industry average data"] : [],
      scope1: productionCO2 * 0.3,
      scope2: energyCO2,
      scope3: materialsCO2 + transportCO2 + (productionCO2 * 0.7),
    },
    status: mappedStatus,
    version: 1,
    createdAt: demoProduct.createdAt,
    updatedAt: demoProduct.updatedAt,
  };
}

const DEMO_PRODUCTS_TOTAL = 30;

const DEMO_CATEGORIES = ["apparel", "footwear", "accessories", "textiles", "homegoods"] as const;

const DEMO_NAMES: Record<(typeof DEMO_CATEGORIES)[number], string[]> = {
  apparel: [
    "Ao T-shirt Organic Cotton",
    "Quan Jeans Recycled Denim",
    "Vay Linen Blend",
    "Ao Hoodie Fleece",
    "Ao So mi Cotton",
    "Quan Short Cotton",
  ],
  footwear: [
    "Giay Sneaker Canvas",
    "Dep Sandal Recycled",
    "Boot Da Tong hop",
    "Giay Luoi Vai",
  ],
  accessories: [
    "Tui Tote Canvas",
    "Vi Da Tai che",
    "Khan Lua Organic",
    "Mu Baseball Cotton",
  ],
  textiles: [
    "Vai Cotton Huu co",
    "Vai Denim Recycled",
    "Vai Linen Natural",
    "Vai Bamboo Fiber",
  ],
  homegoods: [
    "Ga Trai giuong Organic",
    "Khan Tam Bamboo",
    "Rem Cua Linen",
    "Goi Tua Cotton",
  ],
};

const DEMO_PRIMARY_MATERIALS: Record<(typeof DEMO_CATEGORIES)[number], string[]> = {
  apparel: ["organic_cotton", "recycled_polyester", "linen", "cotton"],
  footwear: ["recycled_polyester", "cotton", "nylon"],
  accessories: ["cotton", "linen", "recycled_polyester"],
  textiles: ["organic_cotton", "linen", "cotton"],
  homegoods: ["organic_cotton", "bamboo", "cotton"],
};

const DEMO_SECONDARY_MATERIALS = ["cotton", "recycled_polyester", "linen", "", ""];
const DEMO_STATUS_CYCLE: ProductStatus[] = [
  "draft",
  "published",
  "in_review",
  "archived",
];

const DEMO_MARKETS = ["eu", "us", "jp", "kr", "domestic"];
const DEMO_ENERGY = ["grid", "solar", "mixed", "wind"];
const DEMO_TRANSPORT = ["sea", "air", "road", "rail"];
const DEMO_PROCESS = ["cutting_sewing", "knitting", "weaving", "full_package"];

function generateSyntheticDemoProductData(count: number, startIndex: number): ProductData[] {
  const items: ProductData[] = [];

  for (let i = 0; i < count; i += 1) {
    const index = startIndex + i;
    const category = DEMO_CATEGORIES[index % DEMO_CATEGORIES.length];
    const nameList = DEMO_NAMES[category];
    const productName = nameList[index % nameList.length];
    const primaryMaterials = DEMO_PRIMARY_MATERIALS[category];
    const primaryMaterial = primaryMaterials[index % primaryMaterials.length];
    const secondaryMaterial = DEMO_SECONDARY_MATERIALS[index % DEMO_SECONDARY_MATERIALS.length];
    const primaryPercentage = secondaryMaterial ? 70 : 100;
    const secondaryPercentage = secondaryMaterial ? 30 : 0;
    const status = DEMO_STATUS_CYCLE[index % DEMO_STATUS_CYCLE.length];
    const weight = (0.25 + (index % 6) * 0.05).toFixed(2);
    const createdDay = String((index % 28) + 1).padStart(2, "0");
    const createdAt = `2024-02-${createdDay}T09:00:00Z`;

    items.push({
      id: `demo-product-${String(index + 1).padStart(3, "0")}`,
      productName,
      productCode: `DEMO-SKU-${String(index + 1).padStart(3, "0")}`,
      category,
      description: "San pham demo du lieu mo phong",
      weight,
      unit: "kg",
      primaryMaterial,
      materialPercentage: String(primaryPercentage),
      secondaryMaterial,
      secondaryPercentage: String(secondaryPercentage),
      recycledContent: primaryMaterial === "recycled_polyester" ? "60" : "0",
      certifications: primaryMaterial === "organic_cotton" ? ["gots"] : [],
      manufacturingLocation: "TP. Ho Chi Minh, Vietnam",
      energySource: DEMO_ENERGY[index % DEMO_ENERGY.length],
      processType: DEMO_PROCESS[index % DEMO_PROCESS.length],
      wasteRecovery: index % 2 === 0 ? "partial" : "full",
      originCountry: "Vietnam",
      destinationMarket: DEMO_MARKETS[index % DEMO_MARKETS.length],
      transportMode: DEMO_TRANSPORT[index % DEMO_TRANSPORT.length],
      packagingType: "recycled_paper",
      packagingWeight: "0.02",
      sourceType: index % 3 === 0 ? "proxy" : "documented",
      confidenceLevel: status === "published" ? 90 : status === "in_review" ? 78 : 68,
      isDemo: true,
      createdAt,
      createdBy: "demo@weavecarbon.com",
      status,
      updatedAt: createdAt,
    });
  }

  return items;
}

function getDemoProductDataList(): ProductData[] {
  if (DEMO_PRODUCTS.length >= DEMO_PRODUCTS_TOTAL) {
    return DEMO_PRODUCTS.slice(0, DEMO_PRODUCTS_TOTAL);
  }

  const needed = DEMO_PRODUCTS_TOTAL - DEMO_PRODUCTS.length;
  const synthetic = generateSyntheticDemoProductData(needed, DEMO_PRODUCTS.length);
  return [...DEMO_PRODUCTS, ...synthetic];
}

// Get all demo products as stored products
export function getDemoProducts() {
  return getDemoProductDataList().map(transformDemoProductToStoredProduct);
}

// Get a single demo product by ID
export function getDemoProductById(productId: string) {
  const demoProduct = getDemoProductDataList().find((p) => p.id === productId);
  if (!demoProduct) return null;
  return transformDemoProductToStoredProduct(demoProduct);
}
