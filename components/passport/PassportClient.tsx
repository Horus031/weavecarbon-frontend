"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Leaf,
  MapPin,
  Truck,
  Ship,
  Plane,
  Package,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  Factory,
  Globe,
  Recycle,
  Award,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMO_PRODUCTS,
  DEMO_TRANSPORTS,
  DEMO_HISTORY,
  ProductData,
  TransportData,
  CalculationHistory,
  MATERIAL_LABELS,
  CERTIFICATION_LABELS,
  MARKET_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/demoData";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const PassportClient: React.FC = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<ProductData | null>(null);
  const [transport, setTransport] = useState<TransportData | null>(null);
  const [calculation, setCalculation] = useState<CalculationHistory | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Green Passport", "Overview of your product passport");
  }, [setPageTitle]);

  useEffect(() => {
    // Load product data from demo or localStorage
    const loadData = () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      // Check demo products first
      let foundProduct = DEMO_PRODUCTS.find((p) => p.id === productId);

      // If not found in demo, check localStorage
      if (!foundProduct) {
        const storedProducts = localStorage.getItem("weavecarbon_products");
        if (storedProducts) {
          const userProducts = JSON.parse(storedProducts) as ProductData[];
          foundProduct = userProducts.find((p) => p.id === productId);
        }
      }

      if (foundProduct) {
        setProduct(foundProduct);

        // Find transport data
        let foundTransport = DEMO_TRANSPORTS.find(
          (t) => t.productId === productId,
        );
        if (!foundTransport) {
          const storedTransports = localStorage.getItem(
            "weavecarbon_transports",
          );
          if (storedTransports) {
            const userTransports = JSON.parse(
              storedTransports,
            ) as TransportData[];
            foundTransport = userTransports.find(
              (t) => t.productId === productId,
            );
          }
        }
        setTransport(foundTransport || null);

        // Find calculation history
        let foundCalc = DEMO_HISTORY.find((h) => h.productId === productId);
        if (!foundCalc) {
          const storedHistory = localStorage.getItem("weavecarbon_history");
          if (storedHistory) {
            const userHistory = JSON.parse(
              storedHistory,
            ) as CalculationHistory[];
            foundCalc = userHistory.find((h) => h.productId === productId);
          }
        }
        setCalculation(foundCalc || null);
      }

      setLoading(false);
    };

    loadData();
  }, [productId]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "ship":
        return <Ship className="w-4 h-4" />;
      case "air":
        return <Plane className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const getExportReadiness = () => {
    if (!product) return 0;
    let score = 50;
    if (product.certifications.length > 0) score += 15;
    if (product.sourceType === "documented") score += 15;
    if (product.recycledContent && parseInt(product.recycledContent) > 0)
      score += 10;
    if (calculation) score += 10;
    return Math.min(score, 100);
  };

  const getComplianceStatus = (market: string) => {
    if (!product) return { status: "pending", label: "Chưa đánh giá" };

    const exportReadiness = getExportReadiness();
    if (market === product.destinationMarket) {
      if (exportReadiness >= 80)
        return { status: "compliant", label: "Đạt chuẩn" };
      if (exportReadiness >= 60)
        return { status: "partial", label: "Đạt một phần" };
    }
    return { status: "pending", label: "Cần bổ sung" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-muted-foreground mb-4">
              Mã QR này không liên kết với sản phẩm nào trong hệ thống.
            </p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportReadiness = getExportReadiness();

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-green-800">Green Passport</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      </header> */}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Product Info Card */}
        <Card className="overflow-hidden">
          <div className="bg-linear-to-r from-green-600 to-emerald-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Sản phẩm</p>
                <h1 className="text-xl font-bold">{product.productName}</h1>
                <p className="text-green-100 text-sm mt-1">
                  SKU: {product.productCode}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30">
                  {product.sourceType === "documented"
                    ? "Có chứng từ"
                    : "Ước tính"}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          </CardContent>
        </Card>

        {/* Carbon Footprint */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              Dấu chân Carbon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation ? (
              <>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-green-600">
                    {calculation.totalCO2.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    kg CO₂e / sản phẩm
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-blue-500" />
                      Nguyên liệu
                    </span>
                    <span className="font-medium">
                      {calculation.materialsCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-orange-500" />
                      Sản xuất
                    </span>
                    <span className="font-medium">
                      {calculation.manufacturingCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-500" />
                      Vận chuyển
                    </span>
                    <span className="font-medium">
                      {calculation.transportCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      Đóng gói
                    </span>
                    <span className="font-medium">
                      {calculation.packagingCO2.toFixed(2)} kg
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Phương pháp: {calculation.carbonVersion}
                </p>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Chưa có dữ liệu tính toán carbon</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transport Journey */}
        {transport && transport.legs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Hành trình vận chuyển
              </CardTitle>
              <CardDescription>
                Tổng: {transport.totalDistanceKm.toLocaleString()} km •{" "}
                {transport.totalCO2Kg.toFixed(1)} kg CO₂e
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transport.legs.map((leg, index) => (
                  <div key={leg.id} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            leg.type === "international"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {getModeIcon(leg.mode)}
                        </div>
                        {index < transport.legs.length - 1 && (
                          <div className="w-0.5 h-8 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{leg.origin.name}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium text-primary">
                          {leg.destination.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {TRANSPORT_MODE_LABELS[leg.mode] || leg.mode}
                          </span>
                          <span>•</span>
                          <span>{leg.distanceKm.toLocaleString()} km</span>
                          <span>•</span>
                          <span>{leg.co2Kg.toFixed(1)} kg CO₂</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Readiness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Sẵn sàng xuất khẩu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Điểm đánh giá</span>
                <span className="text-lg font-bold text-green-600">
                  {exportReadiness}%
                </span>
              </div>
              <Progress value={exportReadiness} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Tuân thủ theo thị trường</p>
              {["eu", "us", "jp", "kr"].map((market) => {
                const compliance = getComplianceStatus(market);
                return (
                  <div
                    key={market}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{MARKET_LABELS[market]}</span>
                    <Badge
                      variant="secondary"
                      className={
                        compliance.status === "compliant"
                          ? "bg-green-100 text-green-700"
                          : compliance.status === "partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }
                    >
                      {compliance.status === "compliant" && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {compliance.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Materials & Certifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Nguồn gốc & Chứng nhận
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Nguyên liệu</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {MATERIAL_LABELS[product.primaryMaterial] ||
                    product.primaryMaterial}{" "}
                  {product.materialPercentage}%
                </Badge>
                {product.secondaryMaterial && (
                  <Badge variant="outline">
                    {MATERIAL_LABELS[product.secondaryMaterial] ||
                      product.secondaryMaterial}{" "}
                    {product.secondaryPercentage}%
                  </Badge>
                )}
              </div>
              {product.recycledContent &&
                parseInt(product.recycledContent) > 0 && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Recycle className="w-3 h-3" />
                    {product.recycledContent}% nguyên liệu tái chế
                  </p>
                )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Chứng nhận</p>
              <div className="flex flex-wrap gap-2">
                {product.certifications.length > 0 ? (
                  product.certifications.map((cert) => (
                    <Badge key={cert} className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {CERTIFICATION_LABELS[cert] || cert}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Chưa có chứng nhận
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nơi sản xuất</p>
                <p className="font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {product.manufacturingLocation}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Thị trường</p>
                <p className="font-medium mt-1">
                  {MARKET_LABELS[product.destinationMarket] ||
                    product.destinationMarket}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Cập nhật:{" "}
              {new Date(product.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <span className="font-semibold text-green-600">WeaveCarbon</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PassportClient;
