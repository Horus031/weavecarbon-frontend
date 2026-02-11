"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import type {
  ProductData,
  TransportData,
  CalculationHistory,
} from "@/types/productData";
import {
  MATERIAL_LABELS,
  CERTIFICATION_LABELS,
  MARKET_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/productLabels";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  ProductAssessmentData,
  PRODUCT_TYPES,
  DESTINATION_MARKETS,
} from "@/components/dashboard/assessment/steps/types";

// Interface for stored products from assessment
interface StoredProduct extends ProductAssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to convert StoredProduct to ProductData format
function convertToProductData(stored: StoredProduct): ProductData {
  const productTypeLabel = PRODUCT_TYPES.find(p => p.value === stored.productType)?.label || stored.productType;
  
  return {
    id: stored.id,
    productName: stored.productName,
    productCode: stored.productCode,
    category: stored.productType || "other",
    description: `${productTypeLabel} - ${stored.quantity || 1} sản phẩm`,
    weight: String(stored.weightPerUnit || 0),
    unit: "g",
    primaryMaterial: stored.materials[0]?.materialType || "",
    materialPercentage: String(stored.materials[0]?.percentage || 0),
    secondaryMaterial: stored.materials[1]?.materialType || "",
    secondaryPercentage: String(stored.materials[1]?.percentage || 0),
    recycledContent: "0",
    certifications: stored.materials.flatMap((m) => m.certifications || []),
    manufacturingLocation: stored.manufacturingLocation || "Việt Nam",
    energySource: stored.energySources[0]?.source || "grid",
    processType: stored.productionProcesses[0] || "",
    wasteRecovery: stored.wasteRecovery || "",
    originCountry: stored.originAddress?.country || "Vietnam",
    destinationMarket: stored.destinationMarket || "vietnam",
    transportMode: stored.transportLegs[0]?.mode || "sea",
    packagingType: "",
    packagingWeight: "",
    sourceType: "documented",
    confidenceLevel: stored.carbonResults?.confidenceLevel === "high" ? 90 : stored.carbonResults?.confidenceLevel === "medium" ? 70 : 50,
    createdAt: stored.createdAt,
    createdBy: "User",
    status: stored.status,
    updatedAt: stored.updatedAt,
  };
}

// Helper to generate calculation history from stored product
function generateCalculationFromProduct(stored: StoredProduct): CalculationHistory | null {
  if (!stored.carbonResults) return null;
  
  const perProduct = stored.carbonResults.perProduct;
  return {
    id: `calc-${stored.id}`,
    productId: stored.id,
    productName: stored.productName,
    transportId: `transport-${stored.id}`,
    totalCO2: perProduct.total || 0,
    materialsCO2: perProduct.materials || 0,
    manufacturingCO2: perProduct.production || 0,
    transportCO2: perProduct.transport || 0,
    packagingCO2: 0,
    carbonVersion: "WeaveCarbon v1.0",
    createdAt: stored.createdAt,
    createdBy: "User",
  };
}

// Helper to generate transport data from stored product
function generateTransportFromProduct(stored: StoredProduct): TransportData | null {
  if (!stored.transportLegs || stored.transportLegs.length === 0) return null;
  
  const legs = stored.transportLegs.map((leg, index) => ({
    id: leg.id,
    legNumber: index + 1,
    type: "international" as const,
    mode: leg.mode === "road" ? "truck_heavy" : leg.mode === "sea" ? "ship" : leg.mode === "air" ? "air" : "rail" as "truck_light" | "truck_heavy" | "ship" | "air" | "rail",
    origin: {
      name: index === 0 ? (stored.originAddress?.city || "Origin") : `Transit ${index}`,
      lat: 0,
      lng: 0,
      type: "address" as const,
    },
    destination: {
      name: index === stored.transportLegs.length - 1 
        ? (stored.destinationAddress?.city || DESTINATION_MARKETS.find(m => m.value === stored.destinationMarket)?.label || "Destination")
        : `Transit ${index + 1}`,
      lat: 0,
      lng: 0,
      type: "address" as const,
    },
    distanceKm: leg.estimatedDistance || 1000,
    emissionFactor: 0.016,
    co2Kg: (stored.carbonResults?.perProduct.transport || 0) / stored.transportLegs.length,
    routeType: leg.mode === "road" ? "road" : leg.mode === "sea" ? "sea" : "air" as "road" | "sea" | "air",
  }));

  return {
    id: `transport-${stored.id}`,
    productId: stored.id,
    legs,
    totalDistanceKm: stored.estimatedTotalDistance || legs.reduce((sum, l) => sum + l.distanceKm, 0),
    totalCO2Kg: stored.carbonResults?.perProduct.transport || 0,
    confidenceLevel: stored.carbonResults?.confidenceLevel === "high" ? 90 : 70,
    createdAt: stored.createdAt,
    createdBy: "User",
  };
}

const PassportClient: React.FC = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const t = useTranslations("passport");

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
    const loadData = () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      let foundProduct: ProductData | null = null;
      let foundTransport: TransportData | null = null;
      let foundCalc: CalculationHistory | null = null;

      const storedProducts = localStorage.getItem("weavecarbonProducts");
      if (storedProducts) {
        const userProducts = JSON.parse(storedProducts) as StoredProduct[];
        const storedProduct = userProducts.find((p) => p.id === productId);
        if (storedProduct) {
          foundProduct = convertToProductData(storedProduct);
          foundTransport = generateTransportFromProduct(storedProduct);
          foundCalc = generateCalculationFromProduct(storedProduct);
        }
      }

      if (!foundProduct) {
        const oldStoredProducts = localStorage.getItem("weavecarbon_products");
        if (oldStoredProducts) {
          const userProducts = JSON.parse(oldStoredProducts) as ProductData[];
          foundProduct = userProducts.find((p) => p.id === productId) || null;
        }
      }

      if (!foundTransport) {
        const storedTransports = localStorage.getItem("weavecarbon_transports");
        if (storedTransports) {
          const userTransports = JSON.parse(storedTransports) as TransportData[];
          foundTransport =
            userTransports.find((t) => t.productId === productId) || null;
        }
      }

      if (!foundCalc) {
        const storedHistory = localStorage.getItem("weavecarbon_history");
        if (storedHistory) {
          const userHistory = JSON.parse(
            storedHistory,
          ) as CalculationHistory[];
          foundCalc = userHistory.find((h) => h.productId === productId) || null;
        }
      }

      if (foundProduct) {
        setProduct(foundProduct);
        setTransport(foundTransport);
        setCalculation(foundCalc);
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
    if (!product) return { status: "pending", label: t("statusNotEvaluated") };

    const exportReadiness = getExportReadiness();
    if (market === product.destinationMarket) {
      if (exportReadiness >= 80)
        return { status: "compliant", label: t("statusCompliant") };
      if (exportReadiness >= 60)
        return { status: "partial", label: t("statusPartial") };
    }
    return { status: "pending", label: t("statusPending") };
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
              {t("notFoundTitle")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("notFoundDescription")}
            </p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                {t("backHome")}
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
                <p className="text-green-100 text-sm mb-1">{t("productLabel")}</p>
                <h1 className="text-xl font-bold">{product.productName}</h1>
                <p className="text-green-100 text-sm mt-1">
                  {t("skuLabel")} {product.productCode}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30">
                  {product.sourceType === "documented"
                    ? t("documentedSource")
                    : t("estimatedSource")}
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
              {t("carbonFootprintTitle")}
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
                    {t("perProductUnit")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-blue-500" />
                      {t("materialsLabel")}
                    </span>
                    <span className="font-medium">
                      {calculation.materialsCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-orange-500" />
                      {t("productionLabel")}
                    </span>
                    <span className="font-medium">
                      {calculation.manufacturingCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-500" />
                      {t("transportLabel")}
                    </span>
                    <span className="font-medium">
                      {calculation.transportCO2.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      {t("packagingLabel")}
                    </span>
                    <span className="font-medium">
                      {calculation.packagingCO2.toFixed(2)} kg
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  {t("methodologyLabel")} {calculation.carbonVersion}
                </p>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>{t("noCalculationData")}</p>
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
                {t("transportJourneyTitle")}
              </CardTitle>
              <CardDescription>
                {t("totalLabel")} {transport.totalDistanceKm.toLocaleString()} km •{" "}
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
              {t("exportReadinessTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t("evaluationScoreLabel")}</span>
                <span className="text-lg font-bold text-green-600">
                  {exportReadiness}%
                </span>
              </div>
              <Progress value={exportReadiness} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">{t("complianceByMarketLabel")}</p>
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
              {t("originCertificationTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">{t("materialsSection")}</p>
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
                    {product.recycledContent}% {t("recycledContentLabel")}
                  </p>
                )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">{t("certificationsSection")}</p>
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
                    {t("noCertifications")}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("manufacturingLocationLabel")}</p>
                <p className="font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {product.manufacturingLocation}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("marketLabel")}</p>
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
              {t("updatedLabel")}{" "}
              {new Date(product.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("poweredBy")}{" "}
            <span className="font-semibold text-green-600">WeaveCarbon</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PassportClient;
