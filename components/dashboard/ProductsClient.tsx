"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  Package,
  PlusCircle,
  ChevronRight,
  QrCode,
  Search,
  FileText,
  TrendingUp,
  Upload,
  Layers,
  Pencil,
  Loader2,
  X } from
"lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import BulkUploadModal from "@/components/dashboard/products/BulkUploadModal";
import BatchManagementModal from "@/components/dashboard/products/BatchManagementModal";
import AssessmentClient from "@/components/dashboard/assessment/AssessmentClient";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { usePermissions } from "@/hooks/usePermissions";
import { showNoPermissionToast } from "@/lib/noPermissionToast";
import { ProductAssessmentData } from "@/components/dashboard/assessment/steps/types";
import {
  fetchProductById,
  fetchProducts,
  isValidProductId,
  type ProductRecord,
  type ProductStatus } from
"@/lib/productsApi";
import {
  fetchLogisticsShipmentById,
  toTransportLegs } from
"@/lib/logisticsApi";

const ITEMS_PER_PAGE = 20;

const ProductsClient: React.FC = () => {
  const router = useRouter();
  const t = useTranslations("products");
  const { setPageTitle } = useDashboardTitle();
  const { canMutate } = usePermissions();

  const STATUS_CONFIG: Record<
    ProductStatus,
    {label: string;className: string;}> =
  {
    draft: {
      label: t("statusLabel.draft"),
      className: "border border-slate-300 bg-slate-200 text-slate-800"
    },
    published: {
      label: t("statusLabel.published"),
      className: "border border-emerald-300 bg-emerald-100 text-emerald-800"
    },
    archived: {
      label: t("statusLabel.archived"),
      className: "border border-amber-300 bg-amber-100 text-amber-800"
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "draft" | "published" | "all">(
    "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0
  });
  const [batchCount, setBatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadRequestSeqRef = useRef(0);

  const [selectedProductForQR, setSelectedProductForQR] = useState<{
    id: string;
    name: string;
    sku: string;
    shipmentId?: string;
  } | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentProductId, setAssessmentProductId] = useState<string | null>(
    null
  );
  const [assessmentInitialData, setAssessmentInitialData] =
  useState<ProductAssessmentData | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const notifyNoPermission = useCallback(() => {
    showNoPermissionToast();
  }, []);

  const mapProductToAssessmentData = useCallback(
    (product: ProductRecord): ProductAssessmentData => ({
      productCode: product.productCode,
      productName: product.productName,
      productType: product.productType,
      weightPerUnit: product.weightPerUnit,
      quantity: product.quantity,
      materials: product.materials,
      accessories: product.accessories,
      productionProcesses: product.productionProcesses,
      energySources: product.energySources,
      manufacturingLocation: product.manufacturingLocation,
      wasteRecovery: product.wasteRecovery,
      destinationMarket: product.destinationMarket,
      originAddress: product.originAddress,
      destinationAddress: product.destinationAddress,
      transportLegs: product.transportLegs,
      estimatedTotalDistance: product.estimatedTotalDistance,
      carbonResults: product.carbonResults,
      status: product.status === "published" ? "published" : "draft",
      version: product.version,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }),
    []
  );

  const closeAssessmentModal = useCallback(() => {
    setShowAssessmentModal(false);
    setAssessmentProductId(null);
    setAssessmentInitialData(null);
  }, []);

  const openCreateAssessment = useCallback(() => {
    if (!canMutate) {
      notifyNoPermission();
      return;
    }
    setAssessmentProductId(null);
    setAssessmentInitialData(null);
    setShowAssessmentModal(true);
  }, [canMutate, notifyNoPermission]);

  const openEditAssessment = useCallback(
    async (product: ProductRecord) => {
      if (!canMutate) {
        notifyNoPermission();
        return;
      }
      if (!isValidProductId(product.id)) {
        toast.error(t("errors.invalidProductId"));
        return;
      }

      setEditingProductId(product.id);
      try {
        const fullProduct = await fetchProductById(product.id);

        let editableProduct = fullProduct;
        const shouldHydrateTransportFromShipment =
        editableProduct.shipmentId &&
        (
        editableProduct.transportLegs.length === 0 ||
        editableProduct.estimatedTotalDistance <= 0 ||
        !editableProduct.destinationMarket
        );

        if (shouldHydrateTransportFromShipment) {
          try {
            const shipment = await fetchLogisticsShipmentById(
              editableProduct.shipmentId as string
            );
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
              estimatedDistance: leg.distanceKm > 0 ? leg.distanceKm : undefined
              };
            });
            const inferredDistance =
            shipment.total_distance_km > 0 ?
            shipment.total_distance_km :
            mappedLegs.reduce(
              (sum, leg) => sum + (typeof leg.estimatedDistance === "number" ? leg.estimatedDistance : 0),
              0
            );
            const hasAddressValue = (
            address: ProductRecord["originAddress"] | ProductRecord["destinationAddress"]) =>
            Boolean(
              address.streetNumber ||
              address.street ||
              address.ward ||
              address.district ||
              address.city ||
              address.stateRegion ||
              address.country ||
              address.postalCode
            );
            const inferredDestinationMarket = (() => {
              const normalizedCountry = shipment.destination.country.trim().toLowerCase();
              if (!normalizedCountry) return editableProduct.destinationMarket;
              if (normalizedCountry.includes("viet")) return "vietnam";
              if (
              normalizedCountry.includes("us") ||
              normalizedCountry.includes("america") ||
              normalizedCountry.includes("hoa ky"))
              {
                return "usa";
              }
              if (normalizedCountry.includes("korea") || normalizedCountry.includes("han quoc")) {
                return "korea";
              }
              if (normalizedCountry.includes("japan") || normalizedCountry.includes("nhat")) {
                return "japan";
              }
              if (normalizedCountry.includes("china") || normalizedCountry.includes("trung quoc")) {
                return "china";
              }
              if (
              normalizedCountry.includes("eu") ||
              normalizedCountry.includes("europe") ||
              normalizedCountry.includes("germany") ||
              normalizedCountry.includes("netherlands"))
              {
                return "eu";
              }
              return editableProduct.destinationMarket;
            })();

            editableProduct = {
              ...editableProduct,
              destinationMarket: editableProduct.destinationMarket || inferredDestinationMarket,
              originAddress:
              hasAddressValue(editableProduct.originAddress) ?
              editableProduct.originAddress :
              {
                ...editableProduct.originAddress,
                street: shipment.origin.address || editableProduct.originAddress.street,
                city: shipment.origin.city || editableProduct.originAddress.city,
                country: shipment.origin.country || editableProduct.originAddress.country,
                lat: shipment.origin.lat ?? editableProduct.originAddress.lat,
                lng: shipment.origin.lng ?? editableProduct.originAddress.lng
              },
              destinationAddress:
              hasAddressValue(editableProduct.destinationAddress) ?
              editableProduct.destinationAddress :
              {
                ...editableProduct.destinationAddress,
                street: shipment.destination.address || editableProduct.destinationAddress.street,
                city: shipment.destination.city || editableProduct.destinationAddress.city,
                country: shipment.destination.country || editableProduct.destinationAddress.country,
                lat: shipment.destination.lat ?? editableProduct.destinationAddress.lat,
                lng: shipment.destination.lng ?? editableProduct.destinationAddress.lng
              },
              transportLegs:
              editableProduct.transportLegs.length > 0 ?
              editableProduct.transportLegs :
              mappedLegs,
              estimatedTotalDistance:
              editableProduct.estimatedTotalDistance > 0 ?
              editableProduct.estimatedTotalDistance :
              inferredDistance
            };
          } catch {

          }
        }

        setAssessmentProductId(editableProduct.id);
        setAssessmentInitialData(mapProductToAssessmentData(editableProduct));
        setShowAssessmentModal(true);
      } catch {
        toast.error(t("errors.failedOpenProductDetail"));
      } finally {
        setEditingProductId((current) => current === product.id ? null : current);
      }
    },
    [canMutate, mapProductToAssessmentData, notifyNoPermission, t]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const loadProducts = useCallback(async () => {
    const requestSeq = loadRequestSeqRef.current + 1;
    loadRequestSeqRef.current = requestSeq;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProducts({
        search: debouncedSearchQuery.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        page_size: ITEMS_PER_PAGE
      });
      if (requestSeq !== loadRequestSeqRef.current) {
        return;
      }

      setProducts(result.items);
      setPagination(result.pagination);
      setBatchCount(0);

      const draftCount = result.items.filter((item) => item.status === "draft").length;
      const publishedCount = result.items.filter(
        (item) => item.status === "published"
      ).length;
      const isGlobalQuery =
      debouncedSearchQuery.trim().length === 0 && statusFilter === "all";

      setStats((previous) => {
        if (isGlobalQuery) {
          return {
            total: result.pagination.total,
            draft:
            result.pagination.total <= result.items.length ?
            draftCount :
            Math.max(previous.draft, draftCount),
            published:
            result.pagination.total <= result.items.length ?
            publishedCount :
            Math.max(previous.published, publishedCount)
          };
        }

        if (previous.total === 0 && result.pagination.total > 0) {
          return {
            total: result.pagination.total,
            draft: draftCount,
            published: publishedCount
          };
        }

        return previous;
      });

      const totalPages = Math.max(1, result.pagination.total_pages || 1);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    } catch {
      if (requestSeq !== loadRequestSeqRef.current) {
        return;
      }
      setProducts([]);
      setPagination({
        page: 1,
        page_size: ITEMS_PER_PAGE,
        total: 0,
        total_pages: 0
      });
      setError(t("errors.failedLoadProducts"));
    } finally {
      if (requestSeq === loadRequestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearchQuery, statusFilter, currentPage, t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts, refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, pagination.total_pages || 1);
  const statCardClass = (target: "all" | "draft" | "published") => {
    const base = "border bg-white shadow";
    if (target === "draft") return `${base} border-slate-300 bg-slate-50`;
    if (target === "published") return `${base} border-emerald-400 bg-emerald-100/75`;
    return `${base} border-slate-300`;
  };

  const filterChipClass = (target: "all" | "draft" | "published") => {
    const base = "h-9 px-3 border text-sm font-medium transition-colors";
    if (statusFilter !== target) {
      return `${base} border-slate-300 bg-white text-slate-800 hover:bg-slate-100`;
    }
    if (target === "draft") {
      return `${base} border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200`;
    }
    if (target === "published") {
      return `${base} border-emerald-400 bg-emerald-100 text-emerald-900 hover:bg-emerald-200`;
    }
    return `${base} border-slate-500 bg-slate-200 text-slate-900 hover:bg-slate-300`;
  };

  const rangeStart =
  products.length === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const rangeEnd =
  products.length === 0 ? 0 : rangeStart + products.length - 1;

  const summaryText = useMemo(
    () =>
    t("summary", {
      total: stats.total,
      draft: stats.draft,
      published: stats.published,
      batches: batchCount
    }),
    [t, stats.total, stats.draft, stats.published, batchCount]
  );

  useEffect(() => {
    setPageTitle(t("title"), summaryText);
  }, [setPageTitle, t, summaryText]);

  const handleViewProduct = (productId: string) => {
    router.push(`/summary/${productId}`);
  };

  const handleViewProductSafe = async (product: ProductRecord) => {
    if (isValidProductId(product.id)) {
      handleViewProduct(product.id);
      return;
    }

    const searchTerm = product.productCode || product.productName || undefined;
    if (!searchTerm) {
      toast.error(t("errors.invalidProductId"));
      return;
    }

    try {
      const refreshed = await fetchProducts({
        search: searchTerm,
        page: 1,
        page_size: 20
      });

      const exactByCode = refreshed.items.find(
        (item) =>
        item.productCode === product.productCode && isValidProductId(item.id)
      );
      const exactByName = refreshed.items.find(
        (item) =>
        item.productName === product.productName && isValidProductId(item.id)
      );
      const fallback = refreshed.items.find((item) => isValidProductId(item.id));
      const resolvedId = exactByCode?.id || exactByName?.id || fallback?.id;

      if (!resolvedId) {
        const fallbackSlug = (product.productCode || product.productName || "").trim();
        if (fallbackSlug.length > 0) {
          router.push(`/summary/${encodeURIComponent(fallbackSlug)}`);
          return;
        }
        toast.error(t("errors.invalidProductId"));
        return;
      }

      handleViewProduct(resolvedId);
    } catch {
      const fallbackSlug = (product.productCode || product.productName || "").trim();
      if (fallbackSlug.length > 0) {
        router.push(`/summary/${encodeURIComponent(fallbackSlug)}`);
        return;
      }
      toast.error(t("errors.failedOpenProductDetail"));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card className={statCardClass("all")}>

            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-600">{t("stats.all")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={statCardClass("draft")}>

            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-200/80 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
                  <p className="text-xs text-slate-600">{t("stats.draft")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={statCardClass("published")}>

            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-emerald-300 bg-emerald-100/90 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.published}</p>
                  <p className="text-xs text-slate-600">{t("stats.published")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 shadow">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm" />

              {searchQuery.trim().length > 0 &&
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label={t("clearSearchAria")}>

                  <X className="h-4 w-4" />
                </Button>
              }
            </div>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (!canMutate) {
                    notifyNoPermission();
                    return;
                  }
                  setShowBatchModal(true);
                }}
                className="w-full gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 sm:w-auto">

                <Layers className="w-4 h-4" /> {t("manageBatches")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!canMutate) {
                    notifyNoPermission();
                    return;
                  }
                  setShowBulkUpload(true);
                }}
                className="w-full gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 sm:w-auto">

                <Upload className="w-4 h-4" /> {t("uploadFile")}
              </Button>
              <Button
                onClick={openCreateAssessment}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">

                <PlusCircle className="w-4 h-4" /> {t("addProduct")}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={filterChipClass("all")}
              onClick={() => setStatusFilter("all")}>

              {t("allStatusFilter")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={filterChipClass("draft")}
              onClick={() => setStatusFilter("draft")}>

              {t("draftStatus")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={filterChipClass("published")}
              onClick={() => setStatusFilter("published")}>

              {t("publishedStatus")}
            </Button>
          </div>
        </div>

        
        <div className="grid items-stretch gap-3 sm:grid-cols-2">
          {loading ?
          Array.from({ length: 4 }).map((_, index) =>
          <Card key={index} className="sm:col-span-1 border border-slate-300 bg-white shadow">
                <CardContent className="p-4">
                  <div className="mb-2 h-6 w-1/2 rounded bg-slate-200 animate-pulse" />
                  <div className="mb-3 h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
                  <div className="h-5 w-full rounded bg-slate-200 animate-pulse" />
                </CardContent>
              </Card>
          ) :
          products.length === 0 ?
          <Card className="sm:col-span-2 border border-slate-300 bg-slate-50/60 shadow">
              <CardContent className="p-8 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                <h3 className="mb-2 font-medium text-slate-900">{t("notFound")}</h3>
                <p className="mb-4 text-sm text-slate-600">
                  {error || t("tryChangeFilter")}
                </p>
                <Button
                  onClick={openCreateAssessment}
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100">

                  <PlusCircle className="w-4 h-4 mr-2" /> {t("createNew")}
                </Button>
              </CardContent>
            </Card> :

          products.map((product) =>
          <Card
            key={product.id}
            className="h-full min-h-[120px] cursor-pointer border border-slate-300 bg-white shadow transition-all hover:border-slate-400 hover:shadow-lg"
            onClick={() => {
              void handleViewProductSafe(product);
            }}>

                <CardContent className="h-full p-4">
                  <div className="flex h-full flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-900 truncate">{product.productName}</h3>
                        </div>
                        <p className="text-sm text-slate-600">{product.productCode}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.materials.slice(0, 2).map((material) =>
                      <Badge
                        key={material.id}
                        variant="outline"
                        className="text-xs border-slate-300 bg-slate-100 text-slate-700">

                              {material.materialType} {material.percentage}%
                            </Badge>
                      )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-bold text-emerald-700">
                          {typeof product.carbonResults?.perProduct.total === "number" ?
                      `${product.carbonResults.perProduct.total.toFixed(2)} kg` :
                      "-"}
                        </p>
                        <p className="text-xs text-slate-600">{t("co2PerUnit")}</p>
                      </div>

                      <Badge className={STATUS_CONFIG[product.status].className}>
                        {STATUS_CONFIG[product.status].label}
                      </Badge>

                      <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        disabled={editingProductId === product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void openEditAssessment(product);
                        }}
                        title={t("actions.editProduct")}>
                        {editingProductId === product.id ?
                        <Loader2 className="w-4 h-4 animate-spin" /> :
                        <Pencil className="w-4 h-4" />
                        }
                      </Button>

                      {product.status === "published" &&
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-300 bg-white text-emerald-700 hover:bg-emerald-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductForQR({
                        id: product.id,
                        name: product.productName,
                        sku: product.productCode,
                        shipmentId: product.shipmentId || undefined
                      });
                    }}
                    title={t("createQR")}>

                          <QrCode className="w-4 h-4 text-green-600" />
                        </Button>
                  }

                      <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-200">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )
          }
        </div>

        
        {products.length > 0 &&
        <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              {rangeStart}-{rangeEnd} / {pagination.total}
            </span>
            {totalPages > 1 &&
          <div className="flex items-center justify-center gap-2">
                <Button
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}>

                  {t("pagination.prev")}
                </Button>
                <span className="text-xs text-slate-600">
                  {t("pagination.page", {
                current: currentPage,
                total: totalPages
              })}
                </span>
                <Button
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}>

                  {t("pagination.next")}
                </Button>
              </div>
          }
          </div>
        }
      </div>

      
      {selectedProductForQR &&
      <ProductQRCode
        productId={selectedProductForQR.id}
        shipmentId={selectedProductForQR.shipmentId}
        productName={selectedProductForQR.name}
        productCode={selectedProductForQR.sku}
        open={!!selectedProductForQR}
        onClose={() => setSelectedProductForQR(null)} />

      }

      
      {canMutate &&
      <BulkUploadModal
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onCompleted={triggerRefresh} />
      }


      
      {canMutate &&
      <BatchManagementModal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onCompleted={triggerRefresh} />
      }


      
      <Dialog open={canMutate && showAssessmentModal} onOpenChange={(open) => !open && closeAssessmentModal()}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>
              {assessmentProductId ? t("assessmentDialog.editTitle") : t("assessmentDialog.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {assessmentProductId ?
              t("assessmentDialog.editDescription") :
              t("assessmentDialog.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <AssessmentClient
            mode="modal"
            productId={assessmentProductId}
            initialData={assessmentInitialData}
            onClose={closeAssessmentModal}
            onCompleted={() => {
              triggerRefresh();
              closeAssessmentModal();
            }} />

        </DialogContent>
      </Dialog>
    </>);

};

export default ProductsClient;
