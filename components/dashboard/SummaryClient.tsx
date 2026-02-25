"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package, Info } from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import { MATERIAL_TYPES } from "@/components/dashboard/assessment/steps/types";
import {
  ProductCarbonDetail,
  CarbonBreakdownItem,
  MaterialImpactItem,
  ComplianceItem } from
"@/lib/carbonDetailData";
import type { ProductData } from "@/types/productData";
import {
  fetchProductById,
  fetchProducts,
  formatApiErrorMessage,
  isValidProductId,
  type ProductRecord } from
"@/lib/productsApi";
import {
  fetchAllLogisticsShipments,
  fetchLogisticsShipmentById,
  isValidUuid,
  toTransportLegs,
  type LogisticsShipmentDetail,
  type LogisticsShipmentProduct } from
"@/lib/logisticsApi";


import ProductOverviewHeader from "@/components/dashboard/product-details/ProductOverviewHeader";
import CarbonBreakdownChart from "@/components/dashboard/product-details/CarbonBreakdownChart";
import MaterialImpactTable from "@/components/dashboard/product-details/MaterialImpactTable";
import CarbonFootprintCard from "@/components/dashboard/product-details/CarbonFootprintCard";
import ComplianceStatus from "@/components/dashboard/product-details/ComplianceStatus";

interface SummaryClientProps {
  productId: string;
}

interface ShipmentTransportSnapshot {
  shipmentId: string;
  legCount: number;
  shipmentLegTotalCo2Kg: number;
  shipmentTotalCo2Kg: number;
  productAllocatedCo2Kg: number | null;
  productQuantity: number | null;
  productWeightKg: number | null;
  totalAllocatedCo2Kg: number;
  totalQuantity: number;
  totalWeightKg: number;
  productCount: number;
}

interface TransportComputation {
  perUnitCo2Kg: number | null;
  totalBatchCo2Kg: number | null;
  legCount: number;
  hasData: boolean;
  source: "shipment" | "assessment" | "inferred" | "none";
}

const TRANSPORT_FACTOR_BY_MODE: Record<"road" | "sea" | "air" | "rail", number> = {
  road: 0.105,
  sea: 0.016,
  air: 0.602,
  rail: 0.028
};

const normalizeLookupValue = (value: string) => value.trim().toLowerCase();
const sanitizeFilenamePart = (value: string) =>
value.
replace(/[\\/:*?"<>|]+/g, "-").
replace(/\s+/g, "-").
replace(/-+/g, "-").
replace(/^-|-$/g, "");

const sumEstimatedDistance = (legs: Array<{estimatedDistance?: number;}>) =>
legs.reduce((sum, leg) => {
  const distance = leg.estimatedDistance;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance <= 0) {
    return sum;
  }
  return sum + distance;
}, 0);

const findShipmentProductMatch = (
shipment: LogisticsShipmentDetail,
product: ProductRecord)
: LogisticsShipmentProduct | null => {
  const productIdLookup = normalizeLookupValue(product.id);
  const codeLookup = normalizeLookupValue(product.productCode);
  const nameLookup = normalizeLookupValue(product.productName);

  const byId = shipment.products.find((item) =>
  normalizeLookupValue(item.product_id) === productIdLookup
  );
  if (byId) return byId;

  const bySku = shipment.products.find((item) => {
    const skuLookup = normalizeLookupValue(item.sku);
    if (!skuLookup || !codeLookup) {
      return false;
    }
    return (
      skuLookup === codeLookup ||
      skuLookup.includes(codeLookup) ||
      codeLookup.includes(skuLookup)
    );
  });
  if (bySku) return bySku;

  const byName = shipment.products.find((item) =>
  normalizeLookupValue(item.product_name) === nameLookup &&
  nameLookup.length > 0
  );
  return byName || null;
};

const findShipmentByProduct = async (
product: ProductRecord)
: Promise<LogisticsShipmentDetail | null> => {
  const productIdLookup = normalizeLookupValue(product.id);
  const codeLookup = normalizeLookupValue(product.productCode);
  const nameLookup = normalizeLookupValue(product.productName);
  const candidateMap = new Map<string, string>();
  const searchTerms = [
  product.id,
  product.productCode,
  product.productName].
  map((term) => term?.trim()).
  filter((term): term is string => Boolean(term));

  const scoreShipment = (shipment: LogisticsShipmentDetail) => {
    let bestScore = 0;

    for (const shipmentProduct of shipment.products) {
      const shipmentProductId = normalizeLookupValue(shipmentProduct.product_id);
      const shipmentSku = normalizeLookupValue(shipmentProduct.sku || "");
      const shipmentName = normalizeLookupValue(shipmentProduct.product_name || "");

      if (shipmentProductId && shipmentProductId === productIdLookup) {
        bestScore = Math.max(bestScore, 300);
      }
      if (codeLookup.length > 0 && shipmentSku.length > 0) {
        if (shipmentSku === codeLookup) {
          bestScore = Math.max(bestScore, 220);
        } else if (shipmentSku.includes(codeLookup) || codeLookup.includes(shipmentSku)) {
          bestScore = Math.max(bestScore, 150);
        }
      }
      if (nameLookup.length > 0 && shipmentName.length > 0 && shipmentName === nameLookup) {
        bestScore = Math.max(bestScore, shipment.products.length === 1 ? 90 : 60);
      }
    }

    return bestScore;
  };

  for (const term of searchTerms) {
    try {
      const summaries = await fetchAllLogisticsShipments({
        search: term,
        page_size: 20
      });
      for (const summary of summaries) {
        if (isValidUuid(summary.id)) {
          candidateMap.set(summary.id, summary.updated_at);
        }
      }
    } catch {

    }
  }

  if (candidateMap.size === 0) {
    try {
      const summaries = await fetchAllLogisticsShipments({ page_size: 50 });
      for (const summary of summaries) {
        if (isValidUuid(summary.id)) {
          candidateMap.set(summary.id, summary.updated_at);
        }
      }
    } catch {

    }
  }

  let bestMatch: {detail: LogisticsShipmentDetail;score: number;} | null = null;
  const sortedCandidateIds = Array.from(candidateMap.entries()).
  sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime()).
  map(([id]) => id);

  for (const shipmentId of sortedCandidateIds.slice(0, 80)) {
    try {
      const detail = await fetchLogisticsShipmentById(shipmentId);
      const score = scoreShipment(detail);
      if (score <= 0) {
        continue;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { detail, score };
      }

      if (score >= 220) {
        return detail;
      }
    } catch {

    }
  }

  return bestMatch?.detail ?? null;
};

const calculateInferredTransportPerUnit = (product: ProductRecord): number => {
  const weightTonnes = Math.max(0, product.weightPerUnit || 0) / 1_000_000;
  if (weightTonnes <= 0) {
    return 0;
  }

  if (product.transportLegs.length > 0) {
    return product.transportLegs.reduce((sum, leg) => {
      const distance = leg.estimatedDistance;
      if (typeof distance !== "number" || !Number.isFinite(distance) || distance <= 0) {
        return sum;
      }
      const factor =
      typeof leg.emissionFactor === "number" && Number.isFinite(leg.emissionFactor) && leg.emissionFactor > 0 ?
      leg.emissionFactor :
      TRANSPORT_FACTOR_BY_MODE[leg.mode] ?? TRANSPORT_FACTOR_BY_MODE.road;
      return sum + weightTonnes * distance * factor;
    }, 0);
  }

  if (product.estimatedTotalDistance > 0) {
    const fallbackMode = product.transportLegs[0]?.mode ?? "sea";
    const fallbackFactor =
    TRANSPORT_FACTOR_BY_MODE[fallbackMode] ?? TRANSPORT_FACTOR_BY_MODE.sea;
    return weightTonnes * product.estimatedTotalDistance * fallbackFactor;
  }

  return 0;
};


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
  const { setPageTitle } = useDashboardTitle();
  const t = useTranslations("summary");
  const tProductDetail = useTranslations("productDetail");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";
  const [showQRModal, setShowQRModal] = useState(false);
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shipmentTransportSnapshot, setShipmentTransportSnapshot] = useState<ShipmentTransportSnapshot | null>(null);

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
      label: t("statusLabel.archived"),
      className: "border border-amber-200 bg-amber-50 text-amber-700"
    }
  };

  useEffect(() => {
    const fallbackTitle = t("pageTitleFallback");
    const nextTitle = product?.productName?.trim() || fallbackTitle;
    const nextSubtitle =
    product?.productCode && product.productCode.trim().length > 0 ?
    t("skuPrefix", { code: product.productCode }) :
    undefined;
    setPageTitle(nextTitle, nextSubtitle);
  }, [locale, product?.productCode, product?.productName, setPageTitle, t]);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setShipmentTransportSnapshot(null);
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
              setShipmentTransportSnapshot(null);
              setLoadError(null);
              setLoading(false);
            }
            return;
          }

          if (!cancelled) {
            setProduct(null);
            setShipmentTransportSnapshot(null);
            setLoadError(t("errors.invalidProductIdFormat"));
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setProduct(null);
            setShipmentTransportSnapshot(null);
            setLoadError(t("errors.invalidProductIdFormat"));
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
        let hydratedProduct = data;
        let nextShipmentSnapshot: ShipmentTransportSnapshot | null = null;
        let shipment: LogisticsShipmentDetail | null = null;

        if (hydratedProduct.shipmentId) {
          try {
            shipment = await fetchLogisticsShipmentById(
              hydratedProduct.shipmentId
            );
            const hasDirectMatch = Boolean(findShipmentProductMatch(shipment, hydratedProduct));
            if (!hasDirectMatch) {
              shipment = null;
            }
          } catch {
            shipment = null;
          }
        }

        if (!shipment) {
          shipment = await findShipmentByProduct(hydratedProduct);
        }

        if (shipment) {
          try {
            const shipmentLegs = toTransportLegs(shipment);
            const mappedLegs = shipmentLegs.map((leg, index) => {
              const normalizedMode: "road" | "sea" | "air" | "rail" =
              leg.mode === "ship" ? "sea" :
              leg.mode === "air" ? "air" :
              leg.mode === "rail" ? "rail" :
              "road";

              return {
                id: leg.id || `leg-${index + 1}`,
                mode: normalizedMode,
                estimatedDistance: leg.distanceKm > 0 ? leg.distanceKm : undefined,
                emissionFactor:
                Number.isFinite(leg.emissionFactor) && leg.emissionFactor > 0 ?
                leg.emissionFactor :
                undefined,
                co2Kg:
                Number.isFinite(leg.co2Kg) && leg.co2Kg >= 0 ?
                leg.co2Kg :
                undefined
              };
            });
            const inferredDistance =
            shipment.total_distance_km > 0 ?
            shipment.total_distance_km :
            sumEstimatedDistance(mappedLegs);
            const currentLegDistance = sumEstimatedDistance(hydratedProduct.transportLegs);
            const resolvedTransportLegs =
            mappedLegs.length > 0 ?
            mappedLegs :
            hydratedProduct.transportLegs.length > 0 ?
            hydratedProduct.transportLegs :
            mappedLegs;
            const resolvedDistance =
            inferredDistance > 0 ?
            inferredDistance :
            Math.max(hydratedProduct.estimatedTotalDistance, currentLegDistance);
            const matchedShipmentProduct = findShipmentProductMatch(shipment, hydratedProduct);
            const legTotalCo2Kg = shipmentLegs.reduce(
              (sum, leg) =>
              sum + (Number.isFinite(leg.co2Kg) ? Math.max(0, leg.co2Kg) : 0),
              0
            );
            const totalAllocatedCo2Kg = shipment.products.reduce(
              (sum, shipmentProduct) =>
              sum + Math.max(0, shipmentProduct.allocated_co2e),
              0
            );
            const totalQuantity = shipment.products.reduce(
              (sum, shipmentProduct) =>
              sum + Math.max(0, shipmentProduct.quantity),
              0
            );
            const totalWeightKg = shipment.products.reduce(
              (sum, shipmentProduct) =>
              sum + Math.max(0, shipmentProduct.weight_kg),
              0
            );

            nextShipmentSnapshot = {
              shipmentId: shipment.id,
              legCount: mappedLegs.length,
              shipmentLegTotalCo2Kg: legTotalCo2Kg,
              shipmentTotalCo2Kg: Math.max(0, shipment.total_co2e),
              productAllocatedCo2Kg:
              matchedShipmentProduct && matchedShipmentProduct.allocated_co2e > 0 ?
              matchedShipmentProduct.allocated_co2e :
              null,
              productQuantity:
              matchedShipmentProduct && matchedShipmentProduct.quantity > 0 ?
              matchedShipmentProduct.quantity :
              null,
              productWeightKg:
              matchedShipmentProduct && matchedShipmentProduct.weight_kg > 0 ?
              matchedShipmentProduct.weight_kg :
              null,
              totalAllocatedCo2Kg,
              totalQuantity,
              totalWeightKg,
              productCount: shipment.products.length
            };

            hydratedProduct = {
              ...hydratedProduct,
              transportLegs: resolvedTransportLegs,
              estimatedTotalDistance: resolvedDistance,
              shipmentId: shipment.id
            };
          } catch {
            nextShipmentSnapshot = null;
          }
        }

        if (!cancelled) {
          setProduct(hydratedProduct);
          setShipmentTransportSnapshot(nextShipmentSnapshot);
        }
      } catch (error) {
        if (!cancelled) {
          setProduct(null);
          setShipmentTransportSnapshot(null);
          setLoadError(formatApiErrorMessage(error, t("errors.unableToLoadProduct")));
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
  }, [productId, router, t]);


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


  const transportComputation: TransportComputation = useMemo(() => {
    if (!product) {
      return {
        perUnitCo2Kg: null,
        totalBatchCo2Kg: null,
        legCount: 0,
        hasData: false,
        source: "none"
      };
    }

    const legCount = Math.max(
      product.transportLegs.length,
      shipmentTransportSnapshot?.legCount ?? 0
    );
    const perProductTransport =
      typeof product.carbonResults?.perProduct?.transport === "number"
        ? Math.max(0, product.carbonResults.perProduct.transport)
        : 0;

    if (shipmentTransportSnapshot) {
      const shipmentTotalCo2Kg =
        shipmentTransportSnapshot.shipmentLegTotalCo2Kg > 0
          ? shipmentTransportSnapshot.shipmentLegTotalCo2Kg
          : shipmentTransportSnapshot.shipmentTotalCo2Kg;

      if (shipmentTotalCo2Kg > 0) {
        let allocatedBatchCo2: number | null = null;
        const allocatedCo2 = shipmentTransportSnapshot.productAllocatedCo2Kg;
        const allocatedLooksLikeTransport =
          typeof allocatedCo2 === "number" &&
          allocatedCo2 > 0 &&
          allocatedCo2 <= shipmentTotalCo2Kg * 1.25;

        if (
          typeof allocatedCo2 === "number" &&
          allocatedCo2 > 0 &&
          shipmentTransportSnapshot.totalAllocatedCo2Kg > 0
        ) {
          allocatedBatchCo2 =
            shipmentTotalCo2Kg *
            (allocatedCo2 / shipmentTransportSnapshot.totalAllocatedCo2Kg);
        } else if (shipmentTransportSnapshot.productCount === 1) {
          allocatedBatchCo2 = shipmentTotalCo2Kg;
        } else if (
          typeof shipmentTransportSnapshot.productQuantity === "number" &&
          shipmentTransportSnapshot.productQuantity > 0 &&
          shipmentTransportSnapshot.totalQuantity > 0
        ) {
          allocatedBatchCo2 =
            shipmentTotalCo2Kg *
            (shipmentTransportSnapshot.productQuantity /
              shipmentTransportSnapshot.totalQuantity);
        } else if (
          typeof shipmentTransportSnapshot.productWeightKg === "number" &&
          shipmentTransportSnapshot.productWeightKg > 0 &&
          shipmentTransportSnapshot.totalWeightKg > 0
        ) {
          allocatedBatchCo2 =
            shipmentTotalCo2Kg *
            (shipmentTransportSnapshot.productWeightKg /
              shipmentTransportSnapshot.totalWeightKg);
        } else if (allocatedLooksLikeTransport) {
          allocatedBatchCo2 = allocatedCo2;
        }

        if (typeof allocatedBatchCo2 === "number" && allocatedBatchCo2 > 0) {
          const quantityFromProduct =
          typeof product.quantity === "number" && product.quantity > 0 ?
          product.quantity :
          null;
          const quantityFromShipment =
          typeof shipmentTransportSnapshot.productQuantity === "number" &&
          shipmentTransportSnapshot.productQuantity > 0 ?
          shipmentTransportSnapshot.productQuantity :
          null;
          const quantityForPerUnit =
          quantityFromProduct ??
          quantityFromShipment ??
          1;

          return {
            perUnitCo2Kg: allocatedBatchCo2 / quantityForPerUnit,
            totalBatchCo2Kg: allocatedBatchCo2,
            legCount,
            hasData: true,
            source: "shipment"
          };
        }
      }
    }

    if (perProductTransport > 0) {
      return {
        perUnitCo2Kg: perProductTransport,
        totalBatchCo2Kg:
          typeof product.carbonResults?.totalBatch?.transport === "number" &&
          product.carbonResults.totalBatch.transport > 0
            ? product.carbonResults.totalBatch.transport
            : product.quantity > 0
              ? perProductTransport * product.quantity
              : null,
        legCount,
        hasData: true,
        source: "assessment"
      };
    }

    const inferredPerUnit = calculateInferredTransportPerUnit(product);
    if (inferredPerUnit > 0) {
      return {
        perUnitCo2Kg: inferredPerUnit,
        totalBatchCo2Kg: product.quantity > 0 ? inferredPerUnit * product.quantity : null,
        legCount,
        hasData: true,
        source: "inferred"
      };
    }

    return {
      perUnitCo2Kg:
      product.carbonResults?.perProduct ?
      perProductTransport :
      legCount > 0 ?
      0 :
      null,
      totalBatchCo2Kg: null,
      legCount,
      hasData: legCount > 0 || perProductTransport > 0,
      source: "none"
    };
  }, [product, shipmentTransportSnapshot]);

  const carbonBreakdown: CarbonBreakdownItem[] = useMemo(() => {
    if (!product) return [];
    const perProduct = product.carbonResults?.perProduct;
    const hasBreakdownData = Boolean(perProduct);
    const materialsCo2 = hasBreakdownData ? perProduct?.materials || 0 : null;
    const manufacturingCo2 = hasBreakdownData ? perProduct?.production || 0 : null;
    const transportCo2 = transportComputation.perUnitCo2Kg;
    const percentageBase = (() => {
      if (!hasBreakdownData || !perProduct) {
        return 0;
      }
      const recalculatedTotal =
        (perProduct.materials || 0) +
        (perProduct.production || 0) +
        (perProduct.energy || 0) +
        (typeof transportCo2 === "number" ? transportCo2 : perProduct.transport || 0);
      if (recalculatedTotal > 0) {
        return recalculatedTotal;
      }
      return typeof perProduct.total === "number" && perProduct.total > 0
        ? perProduct.total
        : 0;
    })();
    const toPercentage = (
      value: number | null,
      stage?: CarbonBreakdownItem["stage"]
    ) => {
      if (typeof value !== "number") {
        return null;
      }
      if (percentageBase <= 0) {
        if (value <= 0) return 0;
        if (stage === "transport") return 1;
        return 100;
      }
      const rounded = Math.round((value / percentageBase) * 100);
      if (stage === "transport" && value > 0 && rounded === 0) {
        return 1;
      }
      return rounded;
    };
    const transportNoteParts = [
      t("carbonBreakdown.transportLegs", {
        count: transportComputation.legCount
      })
    ];
    const kgFormatter = new Intl.NumberFormat(displayLocale, {
      maximumFractionDigits: 3
    });
    const quantityForBatch =
    typeof product.quantity === "number" && product.quantity > 0 ?
    product.quantity :
    1;
    const transportBatchCo2 =
      typeof transportComputation.totalBatchCo2Kg === "number" &&
      transportComputation.totalBatchCo2Kg > 0
        ? transportComputation.totalBatchCo2Kg
        : typeof transportCo2 === "number" && Number.isFinite(transportCo2) && transportCo2 >= 0
          ? transportCo2 * quantityForBatch
        : null;

    if (transportBatchCo2 !== null) {
      const formattedBatchCo2 = kgFormatter.format(transportBatchCo2);
      transportNoteParts.push(
        t("carbonBreakdown.batchCo2", { value: formattedBatchCo2 })
      );
    }

    return [
      {
        stage: "materials" as const,
        label: t("carbonBreakdown.materials"),
        co2e: materialsCo2,
        percentage: toPercentage(materialsCo2, "materials"),
        note: t("carbonBreakdown.materialTypes", {
          count: product.materials.length
        }),
        isProxy: Boolean(product.carbonResults?.proxyUsed),
        hasData: hasBreakdownData
      },
      {
        stage: "manufacturing" as const,
        label: t("carbonBreakdown.manufacturing"),
        co2e: manufacturingCo2,
        percentage: toPercentage(manufacturingCo2, "manufacturing"),
        note: product.manufacturingLocation || t("carbonBreakdown.unknown"),
        isProxy: Boolean(product.carbonResults?.proxyUsed),
        hasData: hasBreakdownData
      },
      {
        stage: "transport" as const,
        label: t("carbonBreakdown.transport"),
        co2e: transportCo2,
        percentage: toPercentage(transportCo2, "transport"),
        note: transportNoteParts.join(" | "),
        isProxy: Boolean(product.carbonResults?.proxyUsed),
        hasData: transportComputation.hasData
      }
    ];
  }, [displayLocale, product, t, transportComputation]);

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
        factorSource: t("materialFactorSource")
      };
    });
  }, [product, t]);


  const getTransportModeLabel = (mode: string) => {
    const modeKey = mode as "road" | "sea" | "air" | "rail";
    return t(`transportMode.${modeKey}`);
  };

  const getProductionProcessLabel = (processValue: string) => {
    const normalized = processValue.trim().toLowerCase();
    if (!normalized) {
      return t("na");
    }
    const key = `productionInfo.processes.${normalized}`;
    return t.has(key) ? t(key) : processValue;
  };

  const getEnergySourceLabel = (sourceValue: string) => {
    const normalized = sourceValue.trim().toLowerCase();
    if (!normalized) {
      return t("na");
    }
    const key = `productionInfo.energySources.${normalized}`;
    return t.has(key) ? t(key) : sourceValue;
  };

  const getMarketLabel = (marketValue?: string) => {
    const normalized = (marketValue || "").trim();
    if (!normalized) {
      return t("na");
    }
    const lowerCaseKey = normalized.toLowerCase();
    const marketKey = `header.market.${lowerCaseKey}`;
    return tProductDetail.has(marketKey) ?
    tProductDetail(marketKey) :
    normalized;
  };


  const carbonDetail: ProductCarbonDetail | null = useMemo(() => {
    if (!product) return null;

    const perProduct = product.carbonResults?.perProduct;
    const breakdownTotal = carbonBreakdown.reduce(
      (sum, item) => sum + (item.co2e || 0),
      0
    );
    const materialTotal = materialImpact.reduce((sum, item) => sum + item.co2e, 0);
    const transportForTotal =
    typeof transportComputation.perUnitCo2Kg === "number" ?
    transportComputation.perUnitCo2Kg :
    perProduct?.transport || 0;
    const recalculatedTotal =
    perProduct ?
    (perProduct.materials || 0) +
    (perProduct.production || 0) +
    (perProduct.energy || 0) +
    transportForTotal :
    0;
    const total =
    (recalculatedTotal > 0 ?
    recalculatedTotal :
    typeof perProduct?.total === "number" && perProduct.total > 0 ?
    perProduct.total :
    0) || (
    breakdownTotal > 0 ? breakdownTotal : 0) || (
    materialTotal > 0 ? materialTotal : 0);

    const confidenceLevel =
    product.carbonResults?.confidenceLevel || (total > 0 ? "medium" : "low");

    const normalizeComplianceStatus = (
    value: unknown)
    : ComplianceItem["status"] => {
      const normalizedValue = String(value ?? "").trim().toLowerCase();
      if ([
      "passed",
      "pass",
      "compliant",
      "ready",
      "ok",
      "success",
      "verified",
      "met",
      "complete"].
      includes(normalizedValue))
      {
        return "passed";
      }
      if ([
      "failed",
      "fail",
      "non_compliant",
      "not_compliant",
      "rejected",
      "missing",
      "blocked"].
      includes(normalizedValue))
      {
        return "failed";
      }
      return "partial";
    };

    const parseComplianceItems = (value: unknown): ComplianceItem[] => {
      if (!Array.isArray(value)) return [];

      return value.map((rawItem) => {
        if (!rawItem || typeof rawItem !== "object") {
          return null;
        }
        const item = rawItem as Record<string, unknown>;
        const criterion =
        String(
          item.criterion ??
          item.title ??
          item.name ??
          item.label ??
          item.standard ??
          ""
        ).trim();

        if (!criterion) {
          return null;
        }

        const note =
        String(
          item.note ??
          item.description ??
          item.message ??
          ""
        ).trim();

        return {
          criterion,
          status: normalizeComplianceStatus(item.status),
          note: note.length > 0 ? note : undefined
        } as ComplianceItem;
      }).filter((item): item is ComplianceItem => Boolean(item));
    };

    const parseComplianceCriteriaLabels = (value: unknown): string[] => {
      if (typeof value === "string") {
        return value.
        split(/[,;|]/).
        map((item) => item.trim()).
        filter((item) => item.length > 0);
      }

      if (Array.isArray(value)) {
        return value.flatMap((entry) => parseComplianceCriteriaLabels(entry));
      }

      if (!value || typeof value !== "object") {
        return [];
      }

      const record = value as Record<string, unknown>;
      return [
      record.criterion,
      record.name,
      record.title,
      record.label,
      record.standard,
      record.framework,
      record.methodology,
      record.value].
      flatMap((entry) => parseComplianceCriteriaLabels(entry));
    };

    const productRecord = product as unknown as Record<string, unknown>;
    const carbonResultsRecord =
    productRecord.carbonResults &&
    typeof productRecord.carbonResults === "object" ?
    productRecord.carbonResults as Record<string, unknown> :
    {};
    const complianceCandidates: unknown[] = [
    productRecord.compliance,
    productRecord.complianceItems,
    productRecord.exportCompliance,
    carbonResultsRecord.compliance,
    carbonResultsRecord.complianceItems];
    const fallbackCriterionCandidates: unknown[] = [
    productRecord.complianceStandard,
    productRecord.compliance_standard,
    productRecord.complianceStandards,
    productRecord.compliance_standards,
    productRecord.standard,
    productRecord.standards,
    productRecord.framework,
    productRecord.frameworks,
    productRecord.methodology,
    productRecord.methodologies,
    carbonResultsRecord.complianceStandard,
    carbonResultsRecord.compliance_standard,
    carbonResultsRecord.complianceStandards,
    carbonResultsRecord.compliance_standards,
    carbonResultsRecord.standard,
    carbonResultsRecord.standards,
    carbonResultsRecord.framework,
    carbonResultsRecord.frameworks,
    carbonResultsRecord.methodology,
    carbonResultsRecord.methodologies];
    const fallbackCriterion =
    fallbackCriterionCandidates.
    flatMap((candidate) => parseComplianceCriteriaLabels(candidate)).
    find((criterion) => criterion.length > 0) ||
    t("complianceCriteria.iso14067");
    let compliance = complianceCandidates.reduce<ComplianceItem[]>(
      (current, candidate) => {
        if (current.length > 0) {
          return current;
        }
        const parsed = parseComplianceItems(candidate);
        return parsed.length > 0 ? parsed : current;
      },
      []
    );
    const fallbackStatus: ComplianceItem["status"] =
    product.status === "published" && total > 0 ? "passed" : "partial";

    if (compliance.length === 0) {
      compliance = [
      {
        criterion: fallbackCriterion,
        status: fallbackStatus,
        note:
        fallbackStatus === "passed" ?
        t("complianceNote.passed") :
        t("complianceNote.pending")
      }];

    }
    const exportReady =
    compliance.length > 0 ?
    compliance.every((item) => item.status === "passed") :
    product.status === "published" && total > 0;

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
      compliance,
      exportReady,
      suggestions: []
    };
  }, [product, carbonBreakdown, materialImpact, t, transportComputation.perUnitCo2Kg]);


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
          <p className="text-muted-foreground">{t("loadingProduct")}</p>
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

  const handleDownloadReport = async () => {
    try {
      const XLSX = await import("xlsx");
      const generatedAt = new Date();
      const datePart = generatedAt.toISOString().split("T")[0];
      const quantity =
      typeof product.quantity === "number" && product.quantity > 0 ?
      product.quantity :
      1;

      const confidenceScore =
      carbonDetail?.confidenceLevel === "high" ?
      90 :
      carbonDetail?.confidenceLevel === "medium" ?
      70 :
      50;

      const formatNumber = (value: unknown, digits = 3) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return "0";
        return value.toFixed(digits);
      };

      const wb = XLSX.utils.book_new();

      const overviewRows = [
      { metric: "Product ID", value: product.id },
      { metric: "Product Code", value: product.productCode || "" },
      { metric: "Product Name", value: product.productName || "" },
      { metric: "Product Type", value: product.productType || "" },
      { metric: "Status", value: product.status || "" },
      { metric: "Quantity", value: quantity },
      { metric: "Weight Per Unit (g)", value: formatNumber(product.weightPerUnit, 2) },
      { metric: "Destination Market", value: product.destinationMarket || "" },
      { metric: "Estimated Distance (km)", value: formatNumber(product.estimatedTotalDistance, 2) },
      { metric: "Total CO2e Per Unit (kg)", value: formatNumber(carbonDetail?.totalCo2e, 3) },
      { metric: "Confidence Level", value: carbonDetail?.confidenceLevel || "low" },
      { metric: "Confidence Score (%)", value: confidenceScore },
      { metric: "Generated At", value: generatedAt.toISOString() }];

      const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
      wsOverview["!cols"] = [{ wch: 32 }, { wch: 48 }];
      XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

      const breakdownRows = carbonBreakdown.map((item) => ({
        stage: item.stage,
        label: item.label,
        co2e_per_unit_kg: formatNumber(item.co2e, 3),
        co2e_batch_kg: formatNumber((item.co2e || 0) * quantity, 3),
        percentage: item.percentage ?? 0,
        has_data: item.hasData ? "yes" : "no",
        uses_proxy: item.isProxy ? "yes" : "no",
        note: item.note || ""
      }));
      const wsBreakdown = XLSX.utils.json_to_sheet(breakdownRows);
      wsBreakdown["!cols"] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 54 }];
      XLSX.utils.book_append_sheet(wb, wsBreakdown, "Breakdown");

      const materialRows = materialImpact.map((item) => ({
        material: item.material,
        percentage: item.percentage,
        emission_factor_kgco2e_per_kg: formatNumber(item.emissionFactor, 3),
        co2e_per_unit_kg: formatNumber(item.co2e, 3),
        co2e_batch_kg: formatNumber(item.co2e * quantity, 3),
        source: item.source,
        factor_source: item.factorSource
      }));
      const wsMaterials = XLSX.utils.json_to_sheet(materialRows);
      wsMaterials["!cols"] = [
      { wch: 26 },
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 36 }];
      XLSX.utils.book_append_sheet(wb, wsMaterials, "Materials");

      const complianceRows = (carbonDetail?.compliance || []).map((item) => ({
        criterion: item.criterion,
        status: item.status,
        note: item.note || ""
      }));
      const wsCompliance = XLSX.utils.json_to_sheet(complianceRows);
      wsCompliance["!cols"] = [{ wch: 42 }, { wch: 14 }, { wch: 54 }];
      XLSX.utils.book_append_sheet(wb, wsCompliance, "Compliance");

      const fileBase =
      sanitizeFilenamePart(product.productCode || product.id || "carbon-report") ||
      "carbon-report";
      XLSX.writeFile(wb, `${fileBase}-${datePart}.xlsx`);
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Unable to download carbon report."));
    }
  };

  const handleGenerateQR = () => {
    setShowQRModal(true);
  };

  return (
    <>
      
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
          
          <CarbonBreakdownChart
            breakdown={carbonBreakdown}
            quantity={typeof product.quantity === "number" ? product.quantity : 1} />

          
          <MaterialImpactTable materials={materialImpact} />

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                <CardTitle className="text-lg">
                  {t("productionInfo.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("productionInfo.location")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {product.manufacturingLocation || t("na")}
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

                          {getProductionProcessLabel(p)}
                        </Badge>
                    ) :

                    <span className="text-slate-500">{t("na")}</span>
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

                          {getEnergySourceLabel(e.source)} ({e.percentage}%)
                        </Badge>
                    ) :

                    <span className="text-slate-500">{t("na")}</span>
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
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("logisticsInfo.targetMarket")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {getMarketLabel(product.destinationMarket)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("logisticsInfo.totalDistance")}
                  </p>
                  <p className="font-medium text-slate-900">
                    {product.estimatedTotalDistance?.toLocaleString(displayLocale) || t("na")}
                    {typeof product.estimatedTotalDistance === "number" ? ` ${t("units.km")}` : ""}
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

                    <span className="text-slate-500">{t("na")}</span>
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
            <CardContent className="space-y-3 text-sm pt-4">
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
                  {product.quantity?.toLocaleString(displayLocale) || t("na")}{" "}
                  {t("additionalInfo.products")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.createdAt")}
                </span>
                <span>{new Date(product.createdAt).toLocaleDateString(displayLocale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {t("additionalInfo.updatedAt")}
                </span>
                <span>{new Date(product.updatedAt).toLocaleDateString(displayLocale)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      
      {showQRModal &&
      <ProductQRCode
        productId={product.id}
        shipmentId={product.shipmentId || undefined}
        productName={product.productName}
        productCode={product.productCode}
        open={showQRModal}
        onClose={() => setShowQRModal(false)} />

      }
    </>);

}
