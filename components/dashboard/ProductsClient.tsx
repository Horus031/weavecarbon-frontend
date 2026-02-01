"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, ChevronRight, QrCode } from "lucide-react";
import ProductQRCode from "@/components/dashboard/ProductQRCode";
import { useDashboardTitle } from "@/contexts/DashboardContext";

interface Product {
  id: number | string;
  name: string;
  sku: string;
  co2: number;
  status: string;
  materials: string[];
}

interface ProductsClientProps {
  products: Product[];
}

const getStatusBadge = (status: string, hiddenString: string) => {
  switch (status) {
    case "verified":
      return (
        <Badge className={`bg-green-100 text-green-700 ${hiddenString}`}>
          Đã xác minh
        </Badge>
      );
    case "pending":
      return (
        <Badge className={`bg-yellow-100 text-yellow-700 ${hiddenString}`}>
          Chờ duyệt
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="secondary" className={`${hiddenString}`}>
          Nháp
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={`${hiddenString}`}>
          {status}
        </Badge>
      );
  }
};

export default function ProductsClient({ products }: ProductsClientProps) {
  const [selectedProductForQR, setSelectedProductForQR] = useState<{
    id: string;
    name: string;
    sku: string;
  } | null>(null);

  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Products", "Overview of your carbon tracking");
  }, [setPageTitle]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
            <p className="text-muted-foreground">
              Danh sách tất cả sản phẩm đã đánh giá carbon
            </p>
          </div>
          <Link href="/assessment">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" /> Thêm sản phẩm mới
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex-col space-y-2 md:space-y-0 md:flex md:flex-row items-center justify-between">
                  <div className="flex md:hidden">
                    {getStatusBadge(product.status, "flex md:hidden")}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.sku}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {product.materials.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <div className="text-left md:text-right">
                      <p className="text-lg font-bold text-primary">
                        {product.co2} kg
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CO₂e / đơn vị
                      </p>
                    </div>
                    <div className="space-x-3 flex h-fit">
                      {getStatusBadge(product.status, "hidden md:flex")}

                      <div className="flex">
                        {product.status === "verified" && (
                          <Button
                            className="sm:hidden md:flex"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setSelectedProductForQR({
                                id: `demo-product-00${product.id}`,
                                name: product.name,
                                sku: product.sku,
                              })
                            }
                            title="Tạo QR Code"
                          >
                            <QrCode className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
