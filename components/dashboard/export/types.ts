// Compliance types for Export module

export type MarketCode = "EU" | "US" | "JP" | "KR";

export type ComplianceStatus = "draft" | "incomplete" | "ready" | "verified";

export type Priority = "mandatory" | "important" | "recommended";

export type DocumentStatus = "missing" | "uploaded" | "approved" | "expired";

export interface MarketRegulation {
  code: string;
  name: string;
  legalReference: string;
  reportingScope: string;
  reportingFrequency: string;
  enforcementDate: string;
  description: string;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  type: string;
  required: boolean;
  status: DocumentStatus;
  uploadedBy?: string;
  uploadedDate?: string;
  validFrom?: string;
  validTo?: string;
  linkedProducts?: string[];
}

export interface CarbonDataItem {
  scope: "scope1" | "scope2" | "scope3";
  value: number | null;
  unit: string;
  methodology: string;
  dataSource: string;
  reportingPeriod: string;
  isComplete: boolean;
}

export interface ProductScopeItem {
  productId: string;
  productName: string;
  hsCode: string;
  productionSite: string;
  exportVolume: number;
  unit: string;
}

export interface EmissionFactor {
  name: string;
  source: string;
  version: string;
  appliedDate: string;
}

export interface Recommendation {
  id: string;
  type: "document" | "carbon_data" | "verification" | "product_scope";
  missingItem: string;
  regulatoryReason: string;
  businessImpact: string;
  recommendedAction: string[];
  priority: Priority;
  ctaLabel: string;
  ctaAction: string;
  status: "active" | "completed" | "ignored";
}

export interface MarketCompliance {
  market: MarketCode;
  marketName: string;
  regulation: MarketRegulation;
  score: number;
  status: ComplianceStatus;
  lastUpdated: string;
  documents: ComplianceDocument[];
  carbonData: CarbonDataItem[];
  productScope: ProductScopeItem[];
  emissionFactors: EmissionFactor[];
  recommendations: Recommendation[];
  verificationRequired: boolean;
  verifiedBy?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  approvalNote?: string;
}

// Market-specific document requirements
export const MARKET_DOCUMENT_REQUIREMENTS: Record<
  MarketCode,
  { name: string; required: boolean }[]
> = {
  EU: [
    { name: "CBAM Quarterly Report", required: true },
    { name: "Product Carbon Footprint (PCF)", required: true },
    { name: "Emission Calculation Methodology", required: true },
    { name: "Supplier Emission Statement", required: false },
    { name: "Third-party Verification Report", required: false },
  ],
  US: [
    { name: "GHG Disclosure Report", required: true },
    { name: "Product Carbon Declaration", required: false },
    { name: "Internal ESG Policy", required: false },
  ],
  JP: [
    { name: "JIS Carbon Calculation Sheet", required: true },
    { name: "Product Environmental Declaration", required: false },
    { name: "Verification Statement", required: false },
  ],
  KR: [
    { name: "GHG Emission Report (K-ETS)", required: true },
    { name: "Facility-level Emission Proof", required: true },
    { name: "Third-party Verification", required: false },
  ],
};

// Market regulations data
export const MARKET_REGULATIONS: Record<MarketCode, MarketRegulation> = {
  EU: {
    code: "EU CBAM",
    name: "Carbon Border Adjustment Mechanism",
    legalReference: "Regulation (EU) 2023/956",
    reportingScope: "Product-level",
    reportingFrequency: "Quarterly",
    enforcementDate: "2026-01-01",
    description:
      "Cơ chế điều chỉnh biên giới carbon của EU nhằm ngăn chặn rò rỉ carbon và đảm bảo công bằng cạnh tranh.",
  },
  US: {
    code: "US Climate Act",
    name: "California Climate Corporate Data Accountability Act",
    legalReference: "SB 253 & SB 261",
    reportingScope: "Company & Product-level",
    reportingFrequency: "Annual",
    enforcementDate: "2026-01-01",
    description:
      "Quy định báo cáo phát thải GHG bắt buộc cho các công ty hoạt động tại California.",
  },
  JP: {
    code: "JIS Standards",
    name: "Japanese Industrial Standards - GX",
    legalReference: "JIS Q 14067",
    reportingScope: "Product-level",
    reportingFrequency: "Annual",
    enforcementDate: "2025-04-01",
    description:
      "Tiêu chuẩn công nghiệp Nhật Bản về khai báo carbon footprint sản phẩm.",
  },
  KR: {
    code: "K-ETS",
    name: "Korea Emissions Trading Scheme",
    legalReference: "Act on Allocation and Trading of GHG Emission Permits",
    reportingScope: "Facility & Product-level",
    reportingFrequency: "Annual",
    enforcementDate: "2025-01-01",
    description: "Hệ thống giao dịch phát thải Hàn Quốc, phù hợp với CBAM.",
  },
};

// Priority colors and labels
export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string }
> = {
  mandatory: {
    label: "Bắt buộc",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  important: {
    label: "Quan trọng",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  recommended: {
    label: "Nên có",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
};

// Status colors
export const STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Nháp", color: "text-gray-700", bgColor: "bg-gray-100" },
  incomplete: {
    label: "Chưa hoàn thiện",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  ready: {
    label: "Sẵn sàng xuất khẩu",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  verified: {
    label: "Đã xác minh",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
};

export const DOCUMENT_STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; color: string; bgColor: string }
> = {
  missing: { label: "Chưa có", color: "text-red-700", bgColor: "bg-red-100" },
  uploaded: {
    label: "Đã tải lên",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  approved: {
    label: "Đã duyệt",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  expired: {
    label: "Hết hạn",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
};
