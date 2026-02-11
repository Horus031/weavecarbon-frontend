// Section A - Product Overview Header
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Globe, Scale, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductData } from "@/types/productData";
import type { ProductStatus } from "@/types/product";
import {
  CATEGORY_LABELS,
  MARKET_LABELS,
  PRODUCT_STATUS_CONFIG,
} from "@/lib/productLabels";

interface ProductOverviewHeaderProps {
  product: ProductData;
  carbonStatus: "carbon_ready" | "data_partial" | "missing_critical";
}

const CARBON_STATUS_CONFIG = {
  carbon_ready: {
    label: "Carbon-ready",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  data_partial: {
    label: "Data-partial",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  missing_critical: {
    label: "Missing critical data",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const ProductOverviewHeader: React.FC<ProductOverviewHeaderProps> = ({
  product,
  carbonStatus,
}) => {
  const t = useTranslations("productDetail");
  const status = CARBON_STATUS_CONFIG[carbonStatus];
  const productStatus = product.status || "draft";
  const productStatusConfig =
    PRODUCT_STATUS_CONFIG[productStatus as ProductStatus];
  const isDraft = productStatus === "draft" || productStatus === "in_review";

  return (
    <div className="space-y-4 mb-6">
      {/* Draft Warning Banner */}
      {isDraft && (
        <Alert variant="default" className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <span className="font-medium">{t("draftWarning")}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Header Card */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {product.productName}
              </h1>
              <p className="text-sm text-muted-foreground">
                SKU: {product.productCode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
            </div>

            {/* Market */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>
                {MARKET_LABELS[product.destinationMarket] ||
                  product.destinationMarket}
              </span>
            </div>

            {/* Weight */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Scale className="w-4 h-4" />
              <span>
                {product.weight} {product.unit}
              </span>
            </div>

            {/* Product Status Badge */}
            <Badge className={`${productStatusConfig.className} font-medium`}>
              {productStatusConfig.label}
            </Badge>

            {/* Carbon Status Badge */}
            <Badge className={`${status.className} font-medium`}>
              {status.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductOverviewHeader;
