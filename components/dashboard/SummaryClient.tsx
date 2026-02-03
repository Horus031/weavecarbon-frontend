"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/hooks/useProductStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import { useDashboardTitle } from "@/contexts/DashboardContext";

// Import section components
import { getCarbonDetail } from "@/lib/carbonDetailData";
import ProductOverviewHeader from "@/components/dashboard/product-details/ProductOverviewHeader";
import DataCompletenessCheck from "@/components/dashboard/product-details/DataCompletenessCheck";
import CarbonBreakdownChart from "@/components/dashboard/product-details/CarbonBreakdownChart";
import MaterialImpactTable from "@/components/dashboard/product-details/MaterialImpactTable";
import EndOfLifeAssessment from "@/components/dashboard/product-details/EndOfLifeAssessment";
import ImprovementSuggestions from "@/components/dashboard/product-details/ImprovementSuggestion";
import CarbonFootprintCard from "@/components/dashboard/product-details/CarbonFootprintCard";
import ComplianceStatus from "@/components/dashboard/product-details/ComplianceStatus";
import VersionHistory from "@/components/dashboard/product-details/VersionHistory";

interface SummaryClientProps {
  productId: string;
}

export default function SummaryClient({ productId }: SummaryClientProps) {
  const router = useRouter();
  const { getProduct, isLoaded } = useProductStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const { setPageTitle } = useDashboardTitle();

  const product = productId ? getProduct(productId) : null;
  const carbonDetail = productId ? getCarbonDetail(productId) : null;

  useEffect(() => {
    if (product) {
      setPageTitle(product.productName, `SKU: ${product.productCode}`);
    } else {
      setPageTitle("Product Summary", "View product carbon details");
    }
  }, [product, setPageTitle]);

  // Determine carbon status based on confidence
  const getCarbonStatus = () => {
    if (!carbonDetail) return "missing_critical";
    if (carbonDetail.confidenceScore >= 85) return "carbon_ready";
    if (carbonDetail.confidenceScore >= 65) return "data_partial";
    return "missing_critical";
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
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

  // Fallback if no carbon detail exists (non-demo products)
  if (!carbonDetail) {
    return (
      <>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Info className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Chưa có dữ liệu carbon</h2>
            <p className="text-muted-foreground mb-4">
              Sản phẩm này chưa được tính toán carbon footprint. Vui lòng hoàn
              tất nhập dữ liệu vận chuyển.
            </p>
            <Button
              onClick={() => router.push(`/transport?productId=${product.id}`)}
            >
              Tiếp tục nhập vận chuyển
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const handleDownloadReport = () => {
    // TODO: Implement report download
    console.log("Download report for:", product.id);
  };

  const handleGenerateQR = () => {
    setShowQRModal(true);
  };

  return (
    <>
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      {/* Demo data notice */}
      {product.isDemo && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800 text-sm font-medium">
            Demo data – for learning purpose only
          </p>
        </div>
      )}

      {/* Section A - Product Overview Header */}
      <ProductOverviewHeader
        product={product}
        carbonStatus={
          getCarbonStatus() as
            | "carbon_ready"
            | "data_partial"
            | "missing_critical"
        }
      />

      {/* Data Completeness Check - Show for Draft/In Review products */}
      {carbonDetail.isPreliminary && carbonDetail.dataCompleteness && (
        <div className="mb-6">
          <DataCompletenessCheck
            completeness={carbonDetail.dataCompleteness}
            productId={product.id}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section C - Carbon Breakdown Chart */}
          <CarbonBreakdownChart breakdown={carbonDetail.breakdown} />

          {/* Section D - Material Impact Table */}
          <MaterialImpactTable materials={carbonDetail.materialImpact} />

          {/* Section E - End of Life Assessment */}
          <EndOfLifeAssessment endOfLife={carbonDetail.endOfLife} />

          {/* Section G - Improvement Suggestions */}
          <ImprovementSuggestions suggestions={carbonDetail.suggestions} />
        </div>

        {/* Right Column - Summary Cards */}
        <div className="space-y-6">
          {/* Section B - Total Carbon Footprint */}
          <CarbonFootprintCard carbonDetail={carbonDetail} />

          {/* Section F - Compliance Status */}
          <ComplianceStatus
            compliance={carbonDetail.compliance}
            exportReady={carbonDetail.exportReady}
            onDownloadReport={handleDownloadReport}
            onGenerateQR={handleGenerateQR}
          />

          {/* Section - Version History */}
          {carbonDetail.versionHistory &&
            carbonDetail.versionHistory.length > 0 && (
              <VersionHistory
                versions={carbonDetail.versionHistory}
                currentVersion={carbonDetail.versionHistory[0]?.version}
                onView={(version) => console.log("View version:", version)}
                onCompare={(v1, v2) => console.log("Compare:", v1, v2)}
                onRestore={(version) => console.log("Restore:", version)}
              />
            )}
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
