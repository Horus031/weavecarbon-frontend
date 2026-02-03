// Shared data for dashboard pages

import type { ProductStatus } from "@/contexts/ProductContext";

interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  co2: number;
  status: ProductStatus;
  materials: string[];
  category: string;
  scope: string;
  isDemo: boolean;
}

export const carbonTrendData = [
  { month: "T1", emissions: 2100, target: 2500 },
  { month: "T2", emissions: 2400, target: 2500 },
  { month: "T3", emissions: 2200, target: 2400 },
  { month: "T4", emissions: 1900, target: 2300 },
  { month: "T5", emissions: 2100, target: 2200 },
  { month: "T6", emissions: 1800, target: 2100 },
];

export const emissionBreakdown = [
  { name: "Vật liệu", value: 45, color: "hsl(150 60% 20%)" },
  { name: "Sản xuất", value: 25, color: "hsl(30 45% 60%)" },
  { name: "Vận chuyển", value: 20, color: "hsl(150, 40%, 50%)" },
  { name: "Đóng gói", value: 10, color: "hsl(35, 50%, 60%)" },
];

export const marketReadiness = [
  { market: "EU", score: 78, status: "good" },
  { market: "US", score: 65, status: "warning" },
  { market: "JP", score: 82, status: "good" },
  { market: "KR", score: 71, status: "warning" },
];

export const recommendations = [
  {
    id: 1,
    title: "Chuyển sang cotton hữu cơ",
    description: "Giảm 15% carbon footprint cho dòng sản phẩm áo thun",
    impact: "high",
    reduction: "15%",
  },
  {
    id: 2,
    title: "Tối ưu tuyến vận chuyển",
    description: "Kết hợp đường biển + đường bộ thay vì đường hàng không",
    impact: "medium",
    reduction: "8%",
  },
  {
    id: 3,
    title: "Sử dụng bao bì tái chế",
    description: "Thay thế bao bì nhựa bằng giấy tái chế",
    impact: "low",
    reduction: "3%",
  },
];

export const demoProducts: DemoProduct[] = [
  {
    id: "demo-product-001",
    name: "Áo T-shirt Organic Cotton",
    sku: "DEMO-SKU-001",
    co2: 2.4,
    status: "published",
    materials: ["Cotton hữu cơ 100%"],
    category: "apparel",
    scope: "scope1_2_3",
    isDemo: true,
  },
  {
    id: "demo-product-002",
    name: "Quần Jeans Recycled Denim",
    sku: "DEMO-SKU-002",
    co2: 8.5,
    status: "in_review",
    materials: ["Denim tái chế 80%", "Elastane 20%"],
    category: "apparel",
    scope: "scope1_2",
    isDemo: true,
  },
  {
    id: "demo-product-003",
    name: "Váy Linen Blend",
    sku: "DEMO-SKU-003",
    co2: 3.2,
    status: "published",
    materials: ["Linen 60%", "Cotton 40%"],
    category: "apparel",
    scope: "scope1_2_3",
    isDemo: true,
  },
  {
    id: "demo-product-004",
    name: "Áo Hoodie Fleece",
    sku: "DEMO-SKU-004",
    co2: 5.1,
    status: "draft",
    materials: ["Polyester tái chế 100%"],
    category: "apparel",
    scope: "scope1",
    isDemo: true,
  },
];

export const dashboardStats = {
  totalCO2: 2450,
  skuCount: 124,
  shipments: 38,
  exportReadiness: 72,
  confidenceScore: 85,
};

// Helper functions
export const getReadinessColor = (score: number) => {
  if (score >= 75) return "text-green-600 bg-green-100";
  if (score >= 50) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

export const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "bg-green-100 text-green-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};
