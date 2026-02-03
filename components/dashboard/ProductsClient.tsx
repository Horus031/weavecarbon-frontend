"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  FileText,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { ProductStatus } from "@/contexts/ProductContext";

interface Product {
  id: string;
  name: string;
  sku: string;
  co2: number;
  status: ProductStatus;
  materials: string[];
  category: string;
  scope: string;
  isDemo?: boolean;
}

interface ProductsClientProps {
  products: Product[];
}

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
  in_review: {
    label: "Đang xem xét",
    className: "bg-yellow-100 text-yellow-700",
  },
  published: { label: "Đã xuất bản", className: "bg-green-100 text-green-700" },
  archived: { label: "Lưu trữ", className: "bg-blue-100 text-blue-700" },
};

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Quần áo",
  footwear: "Giày dép",
  accessories: "Phụ kiện",
  textiles: "Vải textile",
  homegoods: "Đồ gia dụng",
};

const SCOPE_LABELS: Record<string, string> = {
  scope1: "Scope 1",
  scope1_2: "Scope 1-2",
  scope1_2_3: "Scope 1-2-3",
};

export default function ProductsClient({ products }: ProductsClientProps) {
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Products", "Overview of your carbon tracking");
  }, [setPageTitle]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProductForQR, setSelectedProductForQR] = useState<{
    id: string;
    name: string;
    sku: string;
  } | null>(null);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: products.length,
      draft: products.filter((p) => p.status === "draft").length,
      inReview: products.filter((p) => p.status === "in_review").length,
      published: products.filter((p) => p.status === "published").length,
      archived: products.filter((p) => p.status === "archived").length,
    }),
    [products],
  );

  const handleViewProduct = (productId: string) => {
    router.push(`/summary/${productId}`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
            <p className="text-muted-foreground">
              Tổng cộng {stats.total} sản phẩm • {stats.draft} nháp •{" "}
              {stats.published} đã xuất bản
            </p>
          </div>
          <Button onClick={() => router.push("/assessment")} className="gap-2">
            <PlusCircle className="w-4 h-4" /> Thêm sản phẩm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground">Tất cả</p>
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
                  <p className="text-xs text-muted-foreground">Nháp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("in_review")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                  <p className="text-xs text-muted-foreground">Đang xem xét</p>
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
                  <p className="text-xs text-muted-foreground">Đã xuất bản</p>
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
              placeholder="Tìm kiếm theo tên hoặc SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ProductStatus | "all")}
          >
            <SelectTrigger className="w-full md:w-45">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="in_review">Đang xem xét</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-45">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products List */}
        <div className="grid gap-3">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Thử thay đổi bộ lọc hoặc tạo sản phẩm mới
                </p>
                <Button
                  onClick={() => router.push("/assessment")}
                  variant="outline"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Tạo sản phẩm mới
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewProduct(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {product.name}
                          </h3>
                          {!product.isDemo && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 shrink-0"
                            >
                              Mới
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.sku}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.materials.map((m, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {m}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[product.category] ||
                              product.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-bold text-primary">
                          {product.co2} kg
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CO₂e / đơn vị
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {SCOPE_LABELS[product.scope] || product.scope}
                        </Badge>
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
                              name: product.name,
                              sku: product.sku,
                            });
                          }}
                          title="Tạo QR Code"
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
          <p className="text-sm text-muted-foreground text-center">
            Hiển thị {filteredProducts.length} / {products.length} sản phẩm
          </p>
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
    </>
  );
}
