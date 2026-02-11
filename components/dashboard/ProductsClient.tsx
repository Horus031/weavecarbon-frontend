"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useBatches } from "@/contexts/BatchContext";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  PlusCircle,
  ChevronRight,
  QrCode,
  Search,
  Filter,
  FileText,
  TrendingUp,
  Upload,
  Layers,
} from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import BulkUploadModal from "@/components/dashboard/products/BulkUploadModal";
import BatchManagementModal from "@/components/dashboard/products/BatchManagementModal";
import { useRouter } from "next/navigation";
import { ProductAssessmentData } from "./assessment/steps/types";
import { useDashboardTitle } from "@/contexts/DashboardContext";

// Type for stored products in localStorage
interface StoredProduct extends ProductAssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published";
}

const ProductsClient: React.FC = () => {
  const router = useRouter();
  const { batches } = useBatches();
  const t = useTranslations("products");
  const { setPageTitle } = useDashboardTitle();

  const STATUS_CONFIG: Record<
    "draft" | "published",
    { label: string; className: string }
  > = {
    draft: {
      label: t("statusLabel.draft"),
      className: "bg-gray-100 text-gray-700",
    },
    published: {
      label: t("statusLabel.published"),
      className: "bg-green-100 text-green-700",
    },
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "draft" | "published" | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const loadProducts = useCallback((): StoredProduct[] => {
    if (typeof window === "undefined") return [];

    const storedProducts = JSON.parse(
      localStorage.getItem("weavecarbonProducts") || "[]",
    ) as StoredProduct[];

    return storedProducts;
  }, []);

  const products = useMemo<StoredProduct[]>(() => {
    return loadProducts();
  }, [loadProducts]);

  const [selectedProductForQR, setSelectedProductForQR] = useState<{
    id: string;
    name: string;
    sku: string;
  } | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, products.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const rangeStart =
    filteredProducts.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  // Statistics
  const stats = useMemo(
    () => ({
      total: products.length,
      draft: products.filter((p) => p.status === "draft").length,
      published: products.filter((p) => p.status === "published").length,
    }),
    [products],
  );

  const summaryText = useMemo(
    () =>
      t("summary", {
        total: stats.total,
        draft: stats.draft,
        published: stats.published,
        batches: batches.length,
      }),
    [t, stats.total, stats.draft, stats.published, batches.length],
  );

  useEffect(() => {
    setPageTitle(t("title"), summaryText);
  }, [setPageTitle, t, summaryText]);

  const handleViewProduct = (productId: string) => {
    router.push(`/summary/${productId}`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchModal(true)}
                className="gap-2"
              >
                <Layers className="w-4 h-4" /> {t("manageBatches")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkUpload(true)}
                className="gap-2"
              >
                <Upload className="w-4 h-4" /> {t("uploadFile")}
              </Button>
            </div>
            <Button
              onClick={() => router.push("/assessment")}
              className="gap-2"
            >
              <PlusCircle className="w-4 h-4" /> {t("addProduct")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.all")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("draft")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.draft")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("published")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.published}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.published")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "draft" | "published" | "all")
            }
          >
            <SelectTrigger className="w-full md:w-45">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatusFilter")}</SelectItem>
              <SelectItem value="draft">{t("draftStatus")}</SelectItem>
              <SelectItem value="published">{t("publishedStatus")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products List */}
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredProducts.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">{t("notFound")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("tryChangeFilter")}
                </p>
                <Button
                  onClick={() => router.push("/assessment")}
                  variant="outline"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> {t("createNew")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            paginatedProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewProduct(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {product.productName}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.productCode}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.materials.slice(0, 2).map((m) => (
                            <Badge
                              key={m.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {m.materialType} {m.percentage}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-bold text-primary">
                          {product.carbonResults?.perProduct.total.toFixed(2) ||
                            "—"}{" "}
                          kg
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("co2PerUnit")}
                        </p>
                      </div>

                      <Badge
                        className={STATUS_CONFIG[product.status].className}
                      >
                        {STATUS_CONFIG[product.status].label}
                      </Badge>

                      {product.status === "published" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductForQR({
                              id: product.id,
                              name: product.productName,
                              sku: product.productCode,
                            });
                          }}
                          title={t("createQR")}
                        >
                          <QrCode className="w-4 h-4 text-green-600" />
                        </Button>
                      )}

                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results count */}
        {filteredProducts.length > 0 && (
          totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("pagination.prev")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("pagination.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )
        )}
      </div>

      {/* Product QR Code Modal */}
      {selectedProductForQR && (
        <ProductQRCode
          productId={selectedProductForQR.id}
          productName={selectedProductForQR.name}
          productCode={selectedProductForQR.sku}
          open={!!selectedProductForQR}
          onClose={() => setSelectedProductForQR(null)}
        />
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
      />

      {/* Batch Management Modal */}
      <BatchManagementModal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
      />
    </>
  );
};

export default ProductsClient;
