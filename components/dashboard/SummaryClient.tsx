"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, Package, Info } from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import { MATERIAL_TYPES } from "@/components/dashboard/assessment/steps/types";
import {
  ProductCarbonDetail,
  CarbonBreakdownItem,
  MaterialImpactItem } from
"@/lib/carbonDetailData";
import type { ProductData } from "@/types/productData";
import {
  fetchProductById,
  fetchProducts,
  formatApiErrorMessage,
  isValidProductId,
  type ProductRecord } from
"@/lib/productsApi";


import ProductOverviewHeader from "@/components/dashboard/product-details/ProductOverviewHeader";
import CarbonBreakdownChart from "@/components/dashboard/product-details/CarbonBreakdownChart";
import MaterialImpactTable from "@/components/dashboard/product-details/MaterialImpactTable";
import CarbonFootprintCard from "@/components/dashboard/product-details/CarbonFootprintCard";
import ComplianceStatus from "@/components/dashboard/product-details/ComplianceStatus";

interface SummaryClientProps {
  productId: string;
}


function getMaterialEmissionFactor(materialType: string): number {
  const material = MATERIAL_TYPES.find((m) => m.value === materialType);
  return material?.co2Factor || 6.0;
}


function getMaterialLabel(materialType: string): string {
  const material = MATERIAL_TYPES.find((m) => m.value === materialType);
  return material?.label || materialType;
}

export default function SummaryClient({ productId }: SummaryClientProps) {
  const router = useRouter();
  const t = useTranslations("summary");
  const [showQRModal, setShowQRModal] = useState(false);
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const STATUS_CONFIG: Record<
    "draft" | "published" | "archived",
    {
      label: string;
      className: string;
    }> =
  {
    draft: {
      label: t("statusLabel.draft"),
      className: "border border-slate-200 bg-slate-100 text-slate-700"
    },
    published: {
      label: t("statusLabel.published"),
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700"
    },
    archived: {
      label: "Archived",
      className: "border border-amber-200 bg-amber-50 text-amber-700"
    }
  };

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    if (!isValidProductId(productId)) {
      let cancelled = false;

      const resolveAndRedirect = async () => {
        setLoading(true);
        setLoadError(null);

        try {
          const result = await fetchProducts({
            search: productId,
            page: 1,
            page_size: 20
          });
          const matched = result.items.find((item) =>
          isValidProductId(item.id)
          );

          if (matched) {
            router.replace(`/summary/${matched.id}`);
            return;
          }

          const slug = productId.trim().toLowerCase();
          const matchedByCode = result.items.find(
            (item) => item.productCode.trim().toLowerCase() === slug
          );
          const matchedByName = result.items.find(
            (item) => item.productName.trim().toLowerCase() === slug
          );
          const fallbackItem = matchedByCode || matchedByName || result.items[0];

          if (fallbackItem) {
            if (!cancelled) {
              setProduct(fallbackItem);
              setLoadError(null);
              setLoading(false);
            }
            return;
          }

          if (!cancelled) {
            setProduct(null);
            setLoadError("Invalid product ID format.");
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setProduct(null);
            setLoadError("Invalid product ID format.");
            setLoading(false);
          }
        }
      };

      void resolveAndRedirect();
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await fetchProductById(productId);
        if (!cancelled) {
          setProduct(data);
        }
      } catch (error) {
        if (!cancelled) {
          setProduct(null);
          setLoadError(formatApiErrorMessage(error, "Unable to load product"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, router]);


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
      confidenceLevel:
      product.carbonResults?.confidenceLevel === "high" ?
      90 :
      product.carbonResults?.confidenceLevel === "medium" ?
      70 :
      50,
      createdAt: product.createdAt || new Date().toISOString(),
      createdBy: "User",
      status: product.status,
      updatedAt: product.updatedAt || new Date().toISOString()
    };
  }, [product]);


  const carbonBreakdown: CarbonBreakdownItem[] = useMemo(() => {
    if (!product) return [];
    const perProduct = product.carbonResults?.perProduct;
    const total = perProduct?.total;
    const hasBreakdownData = Boolean(perProduct);
    const toPercentage = (value: number | undefined) => {
      if (!hasBreakdownData || typeof total !== "number" || total <= 0) {
        return null;
      }
      return Math.round((value || 0) / total * 100);
    };

    return [
    {
      stage: "materials" as const,
      label: t("carbonBreakdown.materials"),
      co2e: hasBreakdownData ? perProduct?.materials || 0 : null,
      percentage: toPercentage(perProduct?.materials),
      note: t("carbonBreakdown.materialTypes", {
        count: product.materials.length
      }),
      isProxy: Boolean(product.carbonResults?.proxyUsed),
      hasData: hasBreakdownData
    },
    {
      stage: "manufacturing" as const,
      label: t("carbonBreakdown.manufacturing"),
      co2e: hasBreakdownData ? perProduct?.production || 0 : null,
      percentage: toPercentage(perProduct?.production),
      note: product.manufacturingLocation || t("carbonBreakdown.unknown"),
      isProxy: Boolean(product.carbonResults?.proxyUsed),
      hasData: hasBreakdownData
    },
    {
      stage: "transport" as const,
      label: t("carbonBreakdown.transport"),
      co2e: hasBreakdownData ? perProduct?.transport || 0 : null,
      percentage: toPercentage(perProduct?.transport),
      note: t("carbonBreakdown.transportLegs", {
        count: product.transportLegs.length
      }),
      isProxy: Boolean(product.carbonResults?.proxyUsed),
      hasData: hasBreakdownData && product.transportLegs.length > 0
    }];

  }, [product, t]);


  const materialImpact: MaterialImpactItem[] = useMemo(() => {
    if (!product?.materials) return [];
    const weightPerUnit = product.weightPerUnit || 1000;

    return product.materials.map((m) => {
      const emissionFactor = getMaterialEmissionFactor(m.materialType);
      const weight = weightPerUnit * (m.percentage / 100) / 1000;
      const co2e = weight * emissionFactor;

      return {
        material: getMaterialLabel(m.materialType),
        percentage: m.percentage,
        emissionFactor: emissionFactor,
        co2e: co2e,
        source:
        m.source === "domestic" ?
        "documented" :
        "proxy" as "documented" | "proxy",
        factorSource: "IPCC 2021 / Industry Average"
      };
    });
  }, [product]);


  const getTransportModeLabel = (mode: string) => {
    const modeKey = mode as "road" | "sea" | "air" | "rail";
    return t(`transportMode.${modeKey}`);
  };


  const carbonDetail: ProductCarbonDetail | null = useMemo(() => {
    if (!product) return null;

    const perProduct = product.carbonResults?.perProduct;
    const breakdownTotal = carbonBreakdown.reduce(
      (sum, item) => sum + (item.co2e || 0),
      0
    );
    const materialTotal = materialImpact.reduce((sum, item) => sum + item.co2e, 0);
    const total =
    (typeof perProduct?.total === "number" && perProduct.total > 0 ?
    perProduct.total :
    0) || (
    breakdownTotal > 0 ? breakdownTotal : 0) || (
    materialTotal > 0 ? materialTotal : 0);

    const confidenceLevel =
    product.carbonResults?.confidenceLevel || (total > 0 ? "medium" : "low");

    return {
      productId: product.id,
      totalCo2e: total,
      confidenceLevel: confidenceLevel,
      confidenceScore:
      confidenceLevel === "high" ?
      90 :
      confidenceLevel === "medium" ?
      70 :
      50,
      calculationNote:
      product.carbonResults?.proxyNotes?.join(", ") || t("calculationNote"),
      isPreliminary: product.status === "draft",
      breakdown: carbonBreakdown,
      dataCompleteness: [],
      materialImpact: materialImpact,
      versionHistory: [],
      endOfLife: {
        strategy: "no_takeback" as const,
        strategyLabel: t("endOfLifeStrategy"),
        breakdown: { reuse: 0, recycle: 0, disposal: 100 },
        avoidedEmissions: 0,
        netImpact: 0,
        hasData: false
      },
      compliance: [
      {
        criterion: "ISO 14067",
        status:
        product.status === "published" && total > 0 ?
        "passed" :
        "partial" as "passed" | "partial" | "failed",
        note:
        product.status === "published" && total > 0 ?
        t("complianceNote.passed") :
        t("complianceNote.pending")
      }],

      exportReady: product.status === "published" && total > 0,
      suggestions: []
    };
  }, [product, carbonBreakdown, materialImpact, t]);


  const getCarbonStatus = ():
  "carbon_ready" |
  "data_partial" |
  "missing_critical" => {
    if (!carbonDetail) return "missing_critical";
    if (carbonDetail.confidenceScore >= 85) return "carbon_ready";
    if (carbonDetail.confidenceScore >= 65) return "data_partial";
    return "missing_critical";
  };

  if (!productId) {
    return (
      <Card className="max-w-2xl mx-auto border border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("notFoundTitle")}</h2>
          <p className="text-muted-foreground mb-4">{t("notFoundDesc")}</p>
          <Button onClick={() => router.push("/products")}>
            {t("backToProducts")}
          </Button>
        </CardContent>
      </Card>);

  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto border border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </CardContent>
      </Card>);

  }

  if (!product) {
    return (
      <Card className="max-w-2xl mx-auto border border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("notFoundTitle")}</h2>
          <p className="text-muted-foreground mb-4">
            {loadError || t("notFoundWithId", { productId })}
          </p>
          <Button onClick={() => router.push("/products")}>
            {t("backToProducts")}
          </Button>
        </CardContent>
      </Card>);

  }

  const handleDownloadReport = () => {
    console.log("Download report for:", product.id);
  };

  const handleGenerateQR = () => {
    setShowQRModal(true);
  };

  return (
    <>
      
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backButton")}
      </Button>

      
      {product.status === "draft" &&
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800 text-sm font-medium">
            {t("draftNotice")}
          </p>
        </div>
      }

      
      {productData &&
      <ProductOverviewHeader
        product={productData}
        carbonStatus={getCarbonStatus()} />

      }

      
      <div className="grid lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          
          <CarbonBreakdownChart breakdown={carbonBreakdown} />

          
          <MaterialImpactTable materials={materialImpact} />

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                <CardTitle className="text-lg">
                  {t("productionInfo.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("productionInfo.location")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {product.manufacturingLocation || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("productionInfo.process")}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.productionProcesses?.length > 0 ?
                    product.productionProcesses.map((p, i) =>
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-700 text-xs">

                          {p}
                        </Badge>
                    ) :

                    <span className="text-slate-500">N/A</span>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("productionInfo.energySource")}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.energySources?.length > 0 ?
                    product.energySources.map((e, i) =>
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-700 text-xs">

                          {e.source} ({e.percentage}%)
                        </Badge>
                    ) :

                    <span className="text-slate-500">N/A</span>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                <CardTitle className="text-lg">
                  {t("logisticsInfo.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("logisticsInfo.targetMarket")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {product.destinationMarket || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("logisticsInfo.totalDistance")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {product.estimatedTotalDistance?.toLocaleString() || "N/A"}
                    {typeof product.estimatedTotalDistance === "number" ? " km" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("logisticsInfo.transportLegs")}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.transportLegs?.length > 0 ?
                    product.transportLegs.map((leg, i) =>
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-700 text-xs">

                          {getTransportModeLabel(leg.mode)}
                        </Badge>
                    ) :

                    <span className="text-slate-500">N/A</span>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        
        <div className="space-y-6">
          
          {carbonDetail && <CarbonFootprintCard carbonDetail={carbonDetail} />}

          
          {carbonDetail &&
          <ComplianceStatus
            compliance={carbonDetail.compliance}
            exportReady={carbonDetail.exportReady}
            onDownloadReport={handleDownloadReport}
            onGenerateQR={handleGenerateQR} />

          }

          
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50/70">
              <CardTitle className="text-lg">
                {t("additionalInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.status")}
                </span>
                <Badge className={STATUS_CONFIG[product.status].className}>
                  {STATUS_CONFIG[product.status].label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.version")}
                </span>
                <span>v{product.version || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.quantity")}
                </span>
                <span>
                  {product.quantity?.toLocaleString() || "N/A"}{" "}
                  {t("additionalInfo.products")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.createdAt")}
                </span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.updatedAt")}
                </span>
                <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      
      {showQRModal &&
      <ProductQRCode
        productId={product.id}
        productName={product.productName}
        productCode={product.productCode}
        open={showQRModal}
        onClose={() => setShowQRModal(false)} />

      }
    </>);

}