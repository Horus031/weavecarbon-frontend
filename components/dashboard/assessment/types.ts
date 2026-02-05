// Types for the enhanced Product Assessment flow

export interface MaterialInput {
  id: string;
  materialType: string;
  percentage: number;
  source: "domestic" | "imported" | "unknown";
  certifications: string[];
}

export interface AccessoryInput {
  id: string;
  name: string;
  type: string; // button, zipper, thread, etc.
  weight?: number;
}

export interface EnergySourceInput {
  id: string;
  source: string;
  percentage: number;
}

export interface TransportLeg {
  id: string;
  mode: "road" | "sea" | "air" | "rail";
  estimatedDistance?: number;
}

export interface AddressInput {
  streetNumber: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  stateRegion: string;
  country: string;
  postalCode: string;
}

export interface ProductAssessmentData {
  // Step 1: SKU & Basic Info
  productCode: string;
  productName: string;
  productType: string;
  weightPerUnit: number; // in grams
  quantity: number;

  // Step 2: Materials
  materials: MaterialInput[];
  accessories: AccessoryInput[];

  // Step 3: Production & Energy
  productionProcesses: string[];
  energySources: EnergySourceInput[];
  manufacturingLocation: string;
  wasteRecovery: string;

  // Step 4: Logistics
  destinationMarket: string;
  originAddress: AddressInput;
  destinationAddress: AddressInput;
  transportLegs: TransportLeg[];
  estimatedTotalDistance: number;

  // Step 5: Assessment Results (calculated)
  carbonResults?: CarbonAssessmentResult;

  // Step 6: Save metadata
  status: "draft" | "published";
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarbonBreakdown {
  materials: number;
  production: number;
  energy: number;
  transport: number;
  total: number;
}

export interface CarbonAssessmentResult {
  perProduct: CarbonBreakdown;
  totalBatch: CarbonBreakdown;
  confidenceLevel: "high" | "medium" | "low";
  proxyUsed: boolean;
  proxyNotes: string[];
  scope1: number;
  scope2: number;
  scope3: number;
}

export interface DraftVersion {
  id: string;
  version: number;
  data: ProductAssessmentData;
  timestamp: string;
  note?: string;
}

// Constants
export const PRODUCT_TYPES = [
  { value: "tshirt", label: "Áo thun" },
  { value: "polo", label: "Áo polo" },
  { value: "shirt", label: "Áo sơ mi" },
  { value: "pants", label: "Quần dài" },
  { value: "shorts", label: "Quần short" },
  { value: "dress", label: "Váy/Đầm" },
  { value: "jacket", label: "Áo khoác" },
  { value: "sweater", label: "Áo len" },
  { value: "shoes", label: "Giày" },
  { value: "sandals", label: "Dép/Sandal" },
  { value: "bag", label: "Túi xách" },
  { value: "accessories", label: "Phụ kiện" },
  { value: "other", label: "Khác" },
];

export const MATERIAL_TYPES = [
  { value: "cotton", label: "Cotton", co2Factor: 8.0 },
  { value: "organic_cotton", label: "Cotton hữu cơ", co2Factor: 4.5 },
  { value: "polyester", label: "Polyester", co2Factor: 5.5 },
  { value: "recycled_polyester", label: "Polyester tái chế", co2Factor: 2.5 },
  { value: "wool", label: "Len", co2Factor: 10.1 },
  { value: "silk", label: "Lụa", co2Factor: 7.5 },
  { value: "linen", label: "Lanh", co2Factor: 5.2 },
  { value: "nylon", label: "Nylon", co2Factor: 6.8 },
  { value: "bamboo", label: "Tre/Bamboo", co2Factor: 3.8 },
  { value: "hemp", label: "Gai dầu", co2Factor: 2.9 },
  { value: "viscose", label: "Viscose", co2Factor: 4.2 },
  { value: "tencel", label: "Tencel", co2Factor: 3.5 },
  { value: "blend", label: "Vải pha", co2Factor: 6.0 },
];

export const ACCESSORY_TYPES = [
  { value: "button", label: "Nút" },
  { value: "zipper", label: "Khóa kéo" },
  { value: "thread", label: "Chỉ may" },
  { value: "label", label: "Nhãn mác" },
  { value: "elastic", label: "Thun co giãn" },
  { value: "lining", label: "Vải lót" },
  { value: "padding", label: "Đệm/Mút" },
  { value: "other", label: "Khác" },
];

export const PRODUCTION_PROCESSES = [
  { value: "knitting", label: "Dệt kim", co2Factor: 1.2 },
  { value: "weaving", label: "Dệt thoi", co2Factor: 1.5 },
  { value: "cutting_sewing", label: "Cắt may", co2Factor: 0.8 },
  { value: "dyeing", label: "Nhuộm", co2Factor: 2.5 },
  { value: "printing", label: "In", co2Factor: 1.8 },
  { value: "finishing", label: "Hoàn tất", co2Factor: 0.5 },
];

export const ENERGY_SOURCES = [
  { value: "grid", label: "Điện lưới", co2Factor: 1.0 },
  { value: "solar", label: "Điện mặt trời", co2Factor: 0.05 },
  { value: "wind", label: "Điện gió", co2Factor: 0.03 },
  { value: "coal", label: "Than đá", co2Factor: 2.2 },
  { value: "gas", label: "Khí đốt", co2Factor: 0.5 },
  { value: "mixed", label: "Hỗn hợp", co2Factor: 0.7 },
];

export const DESTINATION_MARKETS = [
  { value: "vietnam", label: "Việt Nam", distance: 500 },
  { value: "usa", label: "Hoa Kỳ", distance: 14000 },
  { value: "korea", label: "Hàn Quốc", distance: 3200 },
  { value: "japan", label: "Nhật Bản", distance: 3500 },
  { value: "eu", label: "Châu Âu", distance: 10000 },
  { value: "china", label: "Trung Quốc", distance: 2500 },
  { value: "other", label: "Khác", distance: 5000 },
];

export const TRANSPORT_MODES = [
  { value: "road", label: "Đường bộ", co2Factor: 0.089 },
  { value: "sea", label: "Đường biển", co2Factor: 0.016 },
  { value: "air", label: "Hàng không", co2Factor: 0.602 },
  { value: "rail", label: "Đường sắt", co2Factor: 0.028 },
];

export const CERTIFICATIONS = [
  { value: "gots", label: "GOTS" },
  { value: "oeko_tex", label: "OEKO-TEX" },
  { value: "grs", label: "GRS" },
  { value: "bci", label: "BCI Cotton" },
  { value: "fsc", label: "FSC" },
  { value: "rcs", label: "RCS" },
];

export const MATERIAL_SOURCES = [
  { value: "domestic", label: "Trong nước" },
  { value: "imported", label: "Nhập khẩu" },
  { value: "unknown", label: "Không xác định" },
];
