"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, Package, Info } from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import {
  ProductAssessmentData,
  MATERIAL_TYPES,
} from "@/components/dashboard/assessment/steps/types";
import {
  ProductCarbonDetail,
  CarbonBreakdownItem,
  MaterialImpactItem,
} from "@/lib/carbonDetailData";
import { ProductData } from "@/lib/demoData";

// Import product-details components
import ProductOverviewHeader from "@/components/dashboard/product-details/ProductOverviewHeader";
import CarbonBreakdownChart from "@/components/dashboard/product-details/CarbonBreakdownChart";
import MaterialImpactTable from "@/components/dashboard/product-details/MaterialImpactTable";
import CarbonFootprintCard from "@/components/dashboard/product-details/CarbonFootprintCard";
import ComplianceStatus from "@/components/dashboard/product-details/ComplianceStatus";

interface StoredProduct extends ProductAssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface SummaryClientProps {
  productId: string;
}

const STATUS_CONFIG = {
  draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
  published: { label: "Đã xuất bản", className: "bg-green-100 text-green-700" },
};

// Helper to get material emission factor
function getMaterialEmissionFactor(materialType: string): number {
  const material = MATERIAL_TYPES.find((m) => m.value === materialType);
  return material?.co2Factor || 6.0; // default factor
}

// Helper to get material label
function getMaterialLabel(materialType: string): string {
  const material = MATERIAL_TYPES.find((m) => m.value === materialType);
  return material?.label || materialType;
}

export default function SummaryClient({ productId }: SummaryClientProps) {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);

  // Load product from localStorage
  const product = useMemo(() => {
    if (!productId || typeof window === "undefined") return null;
    const storedProducts = JSON.parse(
      localStorage.getItem("weavecarbonProducts") || "[]"
    ) as StoredProduct[];
    return storedProducts.find((p) => p.id === productId) || null;
  }, [productId]);

  // Transform to ProductData format for ProductOverviewHeader
  const productData: ProductData | null = useMemo(() => {
    if (!product) return null;
    return {
      id: product.id,
      productName: product.productName,
      productCode: product.productCode,
      category: product.productType || "other",
      description: "",
      weight: String(product.weightPerUnit || 0),
      unit: "g",
      primaryMaterial: product.materials[0]?.materialType || "",
      materialPercentage: String(product.materials[0]?.percentage || 0),
      secondaryMaterial: product.materials[1]?.materialType || "",
      secondaryPercentage: String(product.materials[1]?.percentage || 0),
      recycledContent: "0",
      certifications: product.materials.flatMap((m) => m.certifications || []),
      manufacturingLocation: product.manufacturingLocation || "",
      energySource: product.energySources[0]?.source || "",
      processType: product.productionProcesses[0] || "",
      wasteRecovery: product.wasteRecovery || "",
      originCountry: product.originAddress?.country || "",
      destinationMarket: product.destinationMarket || "",
      transportMode: product.transportLegs[0]?.mode || "",
      packagingType: "",
      packagingWeight: "",
      sourceType: "documented",
      confidenceLevel: product.carbonResults?.confidenceLevel === "high" ? 90 : product.carbonResults?.confidenceLevel === "medium" ? 70 : 50,
      isDemo: false,
      createdAt: product.createdAt || new Date().toISOString(),
      createdBy: "User",
      status: product.status,
      updatedAt: product.updatedAt || new Date().toISOString(),
    };
  }, [product]);

  // Generate CarbonBreakdown from assessment data
  const carbonBreakdown: CarbonBreakdownItem[] = useMemo(() => {
    if (!product?.carbonResults) return [];
    const perProduct = product.carbonResults.perProduct;
    const total = perProduct.total || 1;
    
    return [
      {
        stage: "materials" as const,
        label: "Vật liệu",
        co2e: perProduct.materials || 0,
        percentage: Math.round(((perProduct.materials || 0) / total) * 100),
        note: `${product.materials.length} loại vật liệu`,
        isProxy: false,
        hasData: true,
      },
      {
        stage: "manufacturing" as const,
        label: "Sản xuất",
        co2e: perProduct.production || 0,
        percentage: Math.round(((perProduct.production || 0) / total) * 100),
        note: product.manufacturingLocation || "Không xác định",
        isProxy: false,
        hasData: true,
      },
      {
        stage: "transport" as const,
        label: "Vận chuyển",
        co2e: perProduct.transport || 0,
        percentage: Math.round(((perProduct.transport || 0) / total) * 100),
        note: `${product.transportLegs.length} chặng vận chuyển`,
        isProxy: false,
        hasData: product.transportLegs.length > 0,
      },
    ];
  }, [product]);

  // Generate MaterialImpact from assessment data
  const materialImpact: MaterialImpactItem[] = useMemo(() => {
    if (!product?.materials) return [];
    const weightPerUnit = product.weightPerUnit || 1000; // default 1kg
    
    return product.materials.map((m) => {
      const emissionFactor = getMaterialEmissionFactor(m.materialType);
      const weight = (weightPerUnit * (m.percentage / 100)) / 1000; // convert to kg
      const co2e = weight * emissionFactor;
      
      return {
        material: getMaterialLabel(m.materialType),
        percentage: m.percentage,
        emissionFactor: emissionFactor,
        co2e: co2e,
        source: m.source === "domestic" ? "documented" : "proxy" as "documented" | "proxy",
        factorSource: "IPCC 2021 / Industry Average",
      };
    });
  }, [product]);

  // Generate ProductCarbonDetail for CarbonFootprintCard
  const carbonDetail: ProductCarbonDetail | null = useMemo(() => {
    if (!product?.carbonResults) return null;
    const total = product.carbonResults.perProduct.total || 0;
    const confidenceLevel = product.carbonResults.confidenceLevel || "medium";
    
    return {
      productId: product.id,
      totalCo2e: total,
      confidenceLevel: confidenceLevel,
      confidenceScore: confidenceLevel === "high" ? 90 : confidenceLevel === "medium" ? 70 : 50,
      calculationNote: product.carbonResults.proxyNotes?.join(", ") || "Tính toán từ dữ liệu đánh giá",
      isPreliminary: product.status === "draft",
      breakdown: carbonBreakdown,
      dataCompleteness: [],
      materialImpact: materialImpact,
      versionHistory: [],
      endOfLife: {
        strategy: "no_takeback" as const,
        strategyLabel: "Chưa có chương trình thu hồi",
        breakdown: { reuse: 0, recycle: 0, disposal: 100 },
        avoidedEmissions: 0,
        netImpact: 0,
        hasData: false,
      },
      compliance: [
        {
          criterion: "ISO 14067",
          status: product.status === "published" ? "passed" : "partial" as "passed" | "partial" | "failed",
          note: product.status === "published" ? "Đạt chuẩn" : "Đang chờ hoàn thiện",
        },
      ],
      exportReady: product.status === "published",
      suggestions: [],
    };
  }, [product, carbonBreakdown, materialImpact]);

  // Determine carbon status
  const getCarbonStatus = (): "carbon_ready" | "data_partial" | "missing_critical" => {
    if (!carbonDetail) return "missing_critical";
    if (carbonDetail.confidenceScore >= 85) return "carbon_ready";
    if (carbonDetail.confidenceScore >= 65) return "data_partial";
    return "missing_critical";
  };

  if (!productId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-muted-foreground mb-4">
            Vui lòng chọn sản phẩm từ danh sách hoặc tạo sản phẩm mới.
          </p>
          <Button onClick={() => router.push("/products")}>
            Quay lại Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-muted-foreground mb-4">
            Sản phẩm với ID &quot;{productId}&quot; không tồn tại trong hệ thống.
          </p>
          <Button onClick={() => router.push("/products")}>
            Quay lại Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDownloadReport = () => {
    console.log("Download report for:", product.id);
  };

  const handleGenerateQR = () => {
    setShowQRModal(true);
  };

  return (
    <>
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      {/* Status notice for draft */}
      {product.status === "draft" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800 text-sm font-medium">
            Sản phẩm đang ở trạng thái Nháp - Kết quả carbon chỉ mang tính ước tính
          </p>
        </div>
      )}

      {/* Section A - Product Overview Header */}
      {productData && (
        <ProductOverviewHeader product={productData} carbonStatus={getCarbonStatus()} />
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section C - Carbon Breakdown Chart */}
          {carbonBreakdown.length > 0 && (
            <CarbonBreakdownChart breakdown={carbonBreakdown} />
          )}

          {/* Section D - Material Impact Table */}
          {materialImpact.length > 0 && (
            <MaterialImpactTable materials={materialImpact} />
          )}

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Production Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin sản xuất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Địa điểm sản xuất</p>
                  <p className="font-medium">{product.manufacturingLocation || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quy trình</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.productionProcesses?.length > 0 ? (
                      product.productionProcesses.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nguồn năng lượng</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.energySources?.length > 0 ? (
                      product.energySources.map((e, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {e.source} ({e.percentage}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logistics Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin vận chuyển</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Thị trường đích</p>
                  <p className="font-medium">{product.destinationMarket || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng khoảng cách</p>
                  <p className="font-medium">
                    {product.estimatedTotalDistance?.toLocaleString() || "—"} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Các chặng vận chuyển</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.transportLegs?.length > 0 ? (
                      product.transportLegs.map((leg, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {leg.mode === "road" ? "Đường bộ" : 
                           leg.mode === "sea" ? "Đường biển" : 
                           leg.mode === "air" ? "Đường hàng không" : "Đường sắt"}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Summary Cards */}
        <div className="space-y-6">
          {/* Section B - Total Carbon Footprint */}
          {carbonDetail && <CarbonFootprintCard carbonDetail={carbonDetail} />}

          {/* Section F - Compliance Status */}
          {carbonDetail && (
            <ComplianceStatus
              compliance={carbonDetail.compliance}
              exportReady={carbonDetail.exportReady}
              onDownloadReport={handleDownloadReport}
              onGenerateQR={handleGenerateQR}
            />
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin bổ sung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge className={STATUS_CONFIG[product.status].className}>
                  {STATUS_CONFIG[product.status].label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phiên bản:</span>
                <span>v{product.version || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng:</span>
                <span>{product.quantity?.toLocaleString() || "—"} sản phẩm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạo lúc:</span>
                <span>
                  {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật:</span>
                <span>
                  {new Date(product.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <ProductQRCode
          productId={product.id}
          productName={product.productName}
          productCode={product.productCode}
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </>
  );
}
