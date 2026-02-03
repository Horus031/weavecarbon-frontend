// Carbon Detail Data Types and Demo Data
// For Product Detail Page after B2B assessment
// Updated to support Draft mode with real-time display

export interface CarbonBreakdownItem {
  stage:
    | "materials"
    | "manufacturing"
    | "transport"
    | "packaging"
    | "end_of_life";
  label: string;
  co2e: number | null; // null = awaiting data
  percentage: number | null;
  note: string;
  isProxy: boolean;
  hasData: boolean; // new field to track if data exists
}

export interface MaterialImpactItem {
  material: string;
  percentage: number;
  emissionFactor: number;
  co2e: number;
  source: "documented" | "proxy";
  factorSource: string;
}

export interface EndOfLifeData {
  strategy: "no_takeback" | "selective" | "data_based" | "not_set";
  strategyLabel: string;
  breakdown: {
    reuse: number;
    recycle: number;
    disposal: number;
  };
  avoidedEmissions: number;
  netImpact: number;
  hasData: boolean;
}

export interface ComplianceItem {
  criterion: string;
  status: "passed" | "partial" | "failed";
  note?: string;
}

export interface ImprovementSuggestion {
  id: string;
  type:
    | "material"
    | "transport"
    | "manufacturing"
    | "packaging"
    | "end_of_life";
  title: string;
  description: string;
  potentialReduction: number;
  difficulty: "easy" | "medium" | "hard";
}

// NEW: Data Completeness Check interface
export interface DataCompletenessItem {
  field: string;
  label: string;
  status: "complete" | "partial" | "missing";
  jumpTo?: string; // route to jump to for editing
  note?: string;
}

// NEW: Version History interface
export interface VersionHistoryItem {
  version: string;
  timestamp: string;
  updatedBy: string;
  note: string;
  changes?: string[];
}

export interface ProductCarbonDetail {
  productId: string;
  // Section B - Total Carbon
  totalCo2e: number;
  co2eRange?: { min: number; max: number };
  confidenceLevel: "high" | "medium" | "low";
  confidenceScore: number;
  calculationNote: string;
  isPreliminary: boolean; // NEW: for draft products

  // Section C - Carbon Breakdown
  breakdown: CarbonBreakdownItem[];

  // NEW: Section C (new) - Data Completeness
  dataCompleteness: DataCompletenessItem[];

  // Section D - Material Impact
  materialImpact: MaterialImpactItem[];

  // NEW: Section D (new) - Version History
  versionHistory: VersionHistoryItem[];

  // Section E - End of Life
  endOfLife: EndOfLifeData;

  // Section F - Compliance
  compliance: ComplianceItem[];
  exportReady: boolean;

  // Section G - Suggestions
  suggestions: ImprovementSuggestion[];
}

// Demo carbon detail data mapped by product ID
export const DEMO_CARBON_DETAILS: Record<string, ProductCarbonDetail> = {
  "demo-product-001": {
    productId: "demo-product-001",
    totalCo2e: 2.92,
    confidenceLevel: "high",
    confidenceScore: 92,
    calculationNote: "Calculated using primary data from certified suppliers",
    isPreliminary: false,
    breakdown: [
      {
        stage: "materials",
        label: "Vật liệu",
        co2e: 1.85,
        percentage: 63,
        note: "Organic cotton certified",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "manufacturing",
        label: "Sản xuất",
        co2e: 0.65,
        percentage: 22,
        note: "Solar energy factory",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "transport",
        label: "Vận chuyển",
        co2e: 0.3,
        percentage: 10,
        note: "Sea freight to EU",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "packaging",
        label: "Đóng gói",
        co2e: 0.12,
        percentage: 4,
        note: "Recycled paper",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "end_of_life",
        label: "Cuối vòng đời",
        co2e: 0.0,
        percentage: 1,
        note: "Take-back program",
        isProxy: true,
        hasData: true,
      },
    ],
    dataCompleteness: [
      { field: "weight", label: "Khối lượng sản phẩm", status: "complete" },
      { field: "materials", label: "Vật liệu & tỷ lệ", status: "complete" },
      {
        field: "manufacturing",
        label: "Thông tin sản xuất",
        status: "complete",
      },
      { field: "transport", label: "Vận chuyển", status: "complete" },
      { field: "end_of_life", label: "Cuối vòng đời", status: "complete" },
    ],
    materialImpact: [
      {
        material: "Organic Cotton",
        percentage: 100,
        emissionFactor: 7.4,
        co2e: 1.85,
        source: "documented",
        factorSource: "ecoinvent v3.9",
      },
    ],
    versionHistory: [
      {
        version: "v1.2",
        timestamp: "2024-01-15T14:30:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Hoàn tất dữ liệu vận chuyển",
        changes: ["Thêm route EU", "Cập nhật emission factor"],
      },
      {
        version: "v1.1",
        timestamp: "2024-01-15T12:00:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Cập nhật vật liệu",
        changes: ["Thêm GOTS certification"],
      },
      {
        version: "v1.0",
        timestamp: "2024-01-15T10:30:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Tạo sản phẩm mới",
      },
    ],
    endOfLife: {
      strategy: "data_based",
      strategyLabel: "Chương trình thu hồi",
      breakdown: { reuse: 40, recycle: 45, disposal: 15 },
      avoidedEmissions: -0.85,
      netImpact: -0.55,
      hasData: true,
    },
    compliance: [
      { criterion: "Carbon footprint calculated", status: "passed" },
      { criterion: "Scope 3 Category 1-12", status: "passed" },
      { criterion: "DPP-ready data", status: "passed" },
      { criterion: "Confidence disclosed", status: "passed" },
      {
        criterion: "Third-party verified",
        status: "partial",
        note: "Pending verification",
      },
    ],
    exportReady: true,
    suggestions: [
      {
        id: "sug-001",
        type: "transport",
        title: "Tối ưu tuyến vận chuyển",
        description:
          "Chuyển từ Rotterdam sang Antwerp có thể giảm 15% phát thải vận chuyển",
        potentialReduction: 5,
        difficulty: "easy",
      },
      {
        id: "sug-002",
        type: "packaging",
        title: "Đóng gói gọn hơn",
        description: "Giảm 30% khối lượng bao bì bằng thiết kế tối ưu",
        potentialReduction: 2,
        difficulty: "medium",
      },
    ],
  },
  "demo-product-002": {
    productId: "demo-product-002",
    totalCo2e: 4.48,
    co2eRange: { min: 3.9, max: 5.1 },
    confidenceLevel: "medium",
    confidenceScore: 78,
    calculationNote: "Estimated using proxy factors for some materials",
    isPreliminary: true,
    breakdown: [
      {
        stage: "materials",
        label: "Vật liệu",
        co2e: 2.45,
        percentage: 55,
        note: "Recycled polyester 60%",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "manufacturing",
        label: "Sản xuất",
        co2e: 1.35,
        percentage: 30,
        note: "Mixed energy grid",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "transport",
        label: "Vận chuyển",
        co2e: null,
        percentage: null,
        note: "Chưa có dữ liệu",
        isProxy: true,
        hasData: false,
      },
      {
        stage: "packaging",
        label: "Đóng gói",
        co2e: 0.18,
        percentage: 4,
        note: "Recycled paper",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "end_of_life",
        label: "Cuối vòng đời",
        co2e: 0.1,
        percentage: 2,
        note: "Estimated",
        isProxy: true,
        hasData: true,
      },
    ],
    dataCompleteness: [
      { field: "weight", label: "Khối lượng sản phẩm", status: "complete" },
      { field: "materials", label: "Vật liệu & tỷ lệ", status: "complete" },
      {
        field: "manufacturing",
        label: "Thông tin sản xuất",
        status: "partial",
        note: "Thiếu nguồn năng lượng",
        jumpTo: "/assessment?step=manufacturing&productId=:productId",
      },
      {
        field: "transport",
        label: "Vận chuyển",
        status: "missing",
        note: "Cần nhập route vận chuyển",
        jumpTo: "/transport?productId=:productId",
      },
      {
        field: "end_of_life",
        label: "Cuối vòng đời",
        status: "partial",
        note: "Dùng ước tính",
        jumpTo: "/assessment?step=end_of_life&productId=:productId",
      },
    ],
    materialImpact: [
      {
        material: "Recycled Polyester",
        percentage: 60,
        emissionFactor: 2.1,
        co2e: 1.26,
        source: "documented",
        factorSource: "GRS certified",
      },
      {
        material: "Cotton",
        percentage: 40,
        emissionFactor: 8.3,
        co2e: 1.19,
        source: "proxy",
        factorSource: "DEFRA 2023",
      },
    ],
    versionHistory: [
      {
        version: "v0.3",
        timestamp: "2024-01-18T16:00:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Cập nhật vật liệu",
        changes: ["Thêm recycled polyester data"],
      },
      {
        version: "v0.2",
        timestamp: "2024-01-18T15:00:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Cập nhật manufacturing",
      },
      {
        version: "v0.1",
        timestamp: "2024-01-18T14:45:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Draft - Tạo sản phẩm mới",
      },
    ],
    endOfLife: {
      strategy: "selective",
      strategyLabel: "Thu hồi chọn lọc",
      breakdown: { reuse: 25, recycle: 50, disposal: 25 },
      avoidedEmissions: -0.45,
      netImpact: +0.25,
      hasData: true,
    },
    compliance: [
      { criterion: "Carbon footprint calculated", status: "passed" },
      {
        criterion: "Scope 3 Category 1-12",
        status: "partial",
        note: "Category 9 pending",
      },
      {
        criterion: "DPP-ready data",
        status: "partial",
        note: "Missing supplier data",
      },
      { criterion: "Confidence disclosed", status: "passed" },
      { criterion: "Third-party verified", status: "failed" },
    ],
    exportReady: false,
    suggestions: [
      {
        id: "sug-003",
        type: "material",
        title: "Tăng tỷ lệ tái chế",
        description:
          "Nâng recycled content từ 60% lên 80% có thể giảm 18% phát thải vật liệu",
        potentialReduction: 12,
        difficulty: "medium",
      },
      {
        id: "sug-004",
        type: "manufacturing",
        title: "Chuyển năng lượng xanh",
        description:
          "Sử dụng năng lượng tái tạo 100% có thể giảm 25% phát thải sản xuất",
        potentialReduction: 8,
        difficulty: "hard",
      },
      {
        id: "sug-005",
        type: "end_of_life",
        title: "Thiết kế dễ tái chế",
        description:
          "Thiết kế mono-material giúp tăng khả năng tái chế lên 90%",
        potentialReduction: 5,
        difficulty: "hard",
      },
    ],
  },
  "demo-product-003": {
    productId: "demo-product-003",
    totalCo2e: 5.85,
    co2eRange: { min: 4.8, max: 7.2 },
    confidenceLevel: "low",
    confidenceScore: 62,
    calculationNote: "Estimated using proxy factors (material × region)",
    isPreliminary: true,
    breakdown: [
      {
        stage: "materials",
        label: "Vật liệu",
        co2e: 1.65,
        percentage: 28,
        note: "Linen blend proxy",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "manufacturing",
        label: "Sản xuất",
        co2e: 1.25,
        percentage: 21,
        note: "Grid energy",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "transport",
        label: "Vận chuyển",
        co2e: 2.55,
        percentage: 44,
        note: "Air freight to Japan",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "packaging",
        label: "Đóng gói",
        co2e: 0.1,
        percentage: 2,
        note: "Standard packaging",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "end_of_life",
        label: "Cuối vòng đời",
        co2e: null,
        percentage: null,
        note: "Chưa thiết lập",
        isProxy: true,
        hasData: false,
      },
    ],
    dataCompleteness: [
      { field: "weight", label: "Khối lượng sản phẩm", status: "complete" },
      {
        field: "materials",
        label: "Vật liệu & tỷ lệ",
        status: "partial",
        note: "Dùng proxy factor",
        jumpTo: "/assessment?step=materials&productId=:productId",
      },
      {
        field: "manufacturing",
        label: "Thông tin sản xuất",
        status: "partial",
        note: "Thiếu energy source",
        jumpTo: "/assessment?step=manufacturing&productId=:productId",
      },
      { field: "transport", label: "Vận chuyển", status: "complete" },
      {
        field: "end_of_life",
        label: "Cuối vòng đời",
        status: "missing",
        note: "Cần chọn chiến lược",
        jumpTo: "/assessment?step=end_of_life&productId=:productId",
      },
    ],
    materialImpact: [
      {
        material: "Linen",
        percentage: 70,
        emissionFactor: 5.2,
        co2e: 1.09,
        source: "proxy",
        factorSource: "ADEME Base Carbone",
      },
      {
        material: "Cotton",
        percentage: 30,
        emissionFactor: 8.3,
        co2e: 0.56,
        source: "proxy",
        factorSource: "DEFRA 2023",
      },
    ],
    versionHistory: [
      {
        version: "v0.2",
        timestamp: "2024-01-20T10:30:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Thêm transport route",
        changes: ["Air freight to Japan"],
      },
      {
        version: "v0.1",
        timestamp: "2024-01-20T09:15:00Z",
        updatedBy: "Trinh Nguyen",
        note: "Draft - Tạo sản phẩm mới",
      },
    ],
    endOfLife: {
      strategy: "not_set",
      strategyLabel: "Chưa thiết lập",
      breakdown: { reuse: 0, recycle: 0, disposal: 0 },
      avoidedEmissions: 0,
      netImpact: 0,
      hasData: false,
    },
    compliance: [
      { criterion: "Carbon footprint calculated", status: "passed" },
      {
        criterion: "Scope 3 Category 1-12",
        status: "failed",
        note: "Missing categories",
      },
      {
        criterion: "DPP-ready data",
        status: "failed",
        note: "Insufficient data",
      },
      { criterion: "Confidence disclosed", status: "passed" },
      { criterion: "Third-party verified", status: "failed" },
    ],
    exportReady: false,
    suggestions: [
      {
        id: "sug-006",
        type: "transport",
        title: "Chuyển sang vận chuyển biển",
        description:
          "Sea freight thay air freight có thể giảm 85% phát thải vận chuyển",
        potentialReduction: 35,
        difficulty: "medium",
      },
      {
        id: "sug-007",
        type: "material",
        title: "Xác minh nguồn vật liệu",
        description:
          "Thu thập dữ liệu supplier để nâng confidence từ 62% lên 85%+",
        potentialReduction: 0,
        difficulty: "easy",
      },
      {
        id: "sug-008",
        type: "end_of_life",
        title: "Thiết lập take-back",
        description:
          "Chương trình thu hồi có thể giảm net end-of-life impact 70%",
        potentialReduction: 8,
        difficulty: "hard",
      },
    ],
  },
  "demo-product-004": {
    productId: "demo-product-004",
    totalCo2e: 5.1,
    confidenceLevel: "low",
    confidenceScore: 45,
    calculationNote: "Draft - Preliminary calculation based on proxy data",
    isPreliminary: true,
    breakdown: [
      {
        stage: "materials",
        label: "Vật liệu",
        co2e: 2.8,
        percentage: 55,
        note: "Recycled polyester - awaiting certification",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "manufacturing",
        label: "Sản xuất",
        co2e: 1.2,
        percentage: 24,
        note: "Factory data pending",
        isProxy: true,
        hasData: false,
      },
      {
        stage: "transport",
        label: "Vận chuyển",
        co2e: null,
        percentage: null,
        note: "Chưa nhập dữ liệu",
        isProxy: false,
        hasData: false,
      },
      {
        stage: "packaging",
        label: "Đóng gói",
        co2e: 0.15,
        percentage: 3,
        note: "Standard packaging estimate",
        isProxy: true,
        hasData: true,
      },
      {
        stage: "end_of_life",
        label: "Cuối vòng đời",
        co2e: null,
        percentage: null,
        note: "Chưa thiết lập",
        isProxy: false,
        hasData: false,
      },
    ],
    dataCompleteness: [
      { field: "weight", label: "Khối lượng sản phẩm", status: "complete" },
      { field: "materials", label: "Vật liệu & tỷ lệ", status: "partial", jumpTo: "/assessment/:productId", note: "Cần xác minh chứng nhận" },
      { field: "manufacturing", label: "Thông tin sản xuất", status: "missing", jumpTo: "/assessment/:productId" },
      { field: "transport", label: "Vận chuyển", status: "missing", jumpTo: "/transport?productId=:productId" },
      { field: "end_of_life", label: "Cuối vòng đời", status: "missing" },
    ],
    materialImpact: [
      {
        material: "Recycled Polyester",
        percentage: 100,
        emissionFactor: 2.5,
        co2e: 2.8,
        source: "proxy",
        factorSource: "Industry average",
      },
    ],
    versionHistory: [
      {
        version: "v0.1",
        timestamp: "2024-01-20T09:00:00Z",
        updatedBy: "System",
        note: "Draft created",
        changes: ["Initial product entry"],
      },
    ],
    endOfLife: {
      strategy: "not_set",
      strategyLabel: "Chưa thiết lập",
      breakdown: {
        reuse: 0,
        recycle: 0,
        disposal: 100,
      },
      avoidedEmissions: 0,
      netImpact: 0.95,
      hasData: false,
    },
    compliance: [
      { criterion: "EU CBAM Ready", status: "failed", note: "Missing transport data" },
      { criterion: "ISO 14067", status: "failed", note: "Incomplete LCA" },
      { criterion: "GHG Protocol", status: "partial", note: "Scope 1 only" },
    ],
    exportReady: false,
    suggestions: [
      {
        id: "sug-009",
        type: "transport",
        title: "Nhập dữ liệu vận chuyển",
        description: "Hoàn tất thông tin vận chuyển để tính toán chính xác hơn",
        potentialReduction: 0,
        difficulty: "easy",
      },
      {
        id: "sug-010",
        type: "manufacturing",
        title: "Thu thập dữ liệu sản xuất",
        description: "Liên hệ nhà máy để lấy dữ liệu năng lượng thực tế",
        potentialReduction: 15,
        difficulty: "medium",
      },
      {
        id: "sug-011",
        type: "material",
        title: "Xác minh chứng nhận GRS",
        description: "Upload chứng nhận GRS để xác minh polyester tái chế",
        potentialReduction: 10,
        difficulty: "easy",
      },
    ],
  },
};

// Stage colors for charts
export const STAGE_COLORS: Record<string, string> = {
  materials: "hsl(var(--chart-1))",
  manufacturing: "hsl(var(--chart-2))",
  transport: "hsl(var(--chart-3))",
  packaging: "hsl(var(--chart-4))",
  end_of_life: "hsl(var(--chart-5))",
};

// Confidence level config
export const CONFIDENCE_CONFIG = {
  high: {
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Cao",
    minScore: 85,
  },
  medium: {
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Trung bình",
    minScore: 65,
  },
  low: { color: "text-red-600", bg: "bg-red-100", label: "Thấp", minScore: 0 },
};

// Helper to get carbon detail by product ID
export const getCarbonDetail = (
  productId: string,
): ProductCarbonDetail | null => {
  return DEMO_CARBON_DETAILS[productId] || null;
};
