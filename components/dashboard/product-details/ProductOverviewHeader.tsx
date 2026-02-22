
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
  PRODUCT_STATUS_CONFIG } from
"@/lib/productLabels";

interface ProductOverviewHeaderProps {
  product: ProductData;
  carbonStatus: "carbon_ready" | "data_partial" | "missing_critical";
}

const CARBON_STATUS_CONFIG = {
  carbon_ready: {
    label: "Carbon-ready",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  data_partial: {
    label: "Data-partial",
    className: "border border-amber-200 bg-amber-50 text-amber-700"
  },
  missing_critical: {
    label: "Missing critical data",
    className: "border border-rose-200 bg-rose-50 text-rose-700"
  }
};

const ProductOverviewHeader: React.FC<ProductOverviewHeaderProps> = ({
  product,
  carbonStatus
}) => {
  const t = useTranslations("productDetail");
  const status = CARBON_STATUS_CONFIG[carbonStatus];
  const productStatus = product.status || "draft";
  const productStatusConfig =
  PRODUCT_STATUS_CONFIG[productStatus as ProductStatus];
  const isDraft = productStatus === "draft" || productStatus === "in_review";
  const toDisplayText = (
  value: string | undefined,
  labels?: Record<string, string>) =>
  {
    const normalized = (value ?? "").trim();
    if (!normalized) {
      return "N/A";
    }

    const lowerCaseKey = normalized.toLowerCase();
    return labels?.[normalized] || labels?.[lowerCaseKey] || normalized;
  };

  return (
    <div className="space-y-4 mb-6">
      
      {isDraft &&
      <Alert variant="default" className="border-amber-200 bg-amber-50/80">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-medium">{t("draftWarning")}</span>
          </AlertDescription>
        </Alert>
      }

      
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <Package className="w-7 h-7 text-slate-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {product.productName}
              </h1>
              <p className="text-sm text-slate-600">
                SKU: {product.productCode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Package className="w-4 h-4" />
              <span>{toDisplayText(product.category, CATEGORY_LABELS)}</span>
            </div>

            
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Globe className="w-4 h-4" />
              <span>{toDisplayText(product.destinationMarket, MARKET_LABELS)}</span>
            </div>

            
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Scale className="w-4 h-4" />
              <span>
                {`${(product.weight || "").trim()} ${(product.unit || "").trim()}`.trim() ||
                "N/A"}
              </span>
            </div>

            
            <Badge className={`${productStatusConfig.className} font-medium`}>
              {productStatusConfig.label}
            </Badge>

            
            <Badge className={`${status.className} font-medium`}>
              {status.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>);

};

export default ProductOverviewHeader;