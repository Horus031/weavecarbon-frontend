import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Package } from "lucide-react";
import { ProductAssessmentData, PRODUCT_TYPES } from "./types";

interface Step1SKUInfoProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}

const Step1SKUInfo: React.FC<Step1SKUInfoProps> = ({ data, onChange }) => {
  const t = useTranslations("assessment.step1");
  // Generate SKU instances preview
  const generateSKUPreview = () => {
    if (!data.productCode || !data.quantity || data.quantity <= 0) return [];
    const count = Math.min(data.quantity, 5); // Show max 5 examples
    return Array.from(
      { length: count },
      (_, i) => `${data.productCode}-${String(i + 1).padStart(2, "0")}`,
    );
  };

  const skuPreviews = generateSKUPreview();

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productCode">{t("productCode")}</Label>
          <Input
            id="productCode"
            value={data.productCode}
            onChange={(e) =>
              onChange({ productCode: e.target.value.toUpperCase() })
            }
            placeholder={t("productCodePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("productCodeHint")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="productName">{t("productName")}</Label>
          <Input
            id="productName"
            value={data.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder={t("productNamePlaceholder")}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>{t("productType")}</Label>
          <Select
            value={data.productType}
            onValueChange={(v) => onChange({ productType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("productTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightPerUnit">
            {t("weightPerUnit")}
          </Label>
          <Input
            id="weightPerUnit"
            type="number"
            min="1"
            step="1"
            value={data.weightPerUnit || ""}
            onChange={(e) =>
              onChange({ weightPerUnit: Number(e.target.value) })
            }
            placeholder={t("weightPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("weightHint")}
          </p>
        </div>
      </div>

      {/* Quantity - Key Feature */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-base font-semibold">
                  {t("productionQuantity")}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("quantityHint")}
                </p>
              </div>
              <div className="max-w-xs">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100000"
                  value={data.quantity || ""}
                  onChange={(e) =>
                    onChange({ quantity: Number(e.target.value) })
                  }
                  placeholder={t("quantityPlaceholder")}
                  className="text-lg font-medium"
                />
              </div>

              {/* SKU Preview */}
              {skuPreviews.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">
                    {t("skuPreview")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skuPreviews.map((sku, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-background rounded border text-xs font-mono"
                      >
                        {sku}
                      </span>
                    ))}
                    {data.quantity > 5 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        {t("skuMore", { count: data.quantity - 5 })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              {t("aboutQuantityTitle")}
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>
                • {t("aboutQuantity1")}
              </li>
              <li>• {t("aboutQuantity2")}</li>
              <li>• {t("aboutQuantity3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1SKUInfo;
