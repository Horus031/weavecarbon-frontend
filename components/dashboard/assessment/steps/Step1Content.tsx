import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { ProductAssessmentData, PRODUCT_TYPES } from "./types";

interface Step1SKUInfoProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}

const Step1SKUInfo: React.FC<Step1SKUInfoProps> = ({ data, onChange }) => {
  const hasShownQuantityNoticeRef = useRef(false);

  useEffect(() => {
    if (hasShownQuantityNoticeRef.current) return;
    hasShownQuantityNoticeRef.current = true;

    const storageKey = "assessment_quantity_notice_shown";
    const hasShownInSession =
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(storageKey) === "1";

    if (hasShownInSession) return;

    toast.warning("Về số lượng sản xuất", {
      id: "assessment-quantity-note",
      duration: 12000,
      description:
      <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>Hệ thống sẽ tính carbon cho từng sản phẩm và tổng lô hàng</li>
          <li>Các SKU instance dùng để nhóm theo batch/lô xuất khẩu</li>
          <li>Bạn không cần nhập từng SKU, việc đánh số là tự động</li>
        </ul>

    });

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }
  }, []);


  const generateSKUPreview = () => {
    if (!data.productCode || !data.quantity || data.quantity <= 0) return [];
    const count = Math.min(data.quantity, 5);
    return Array.from(
      { length: count },
      (_, i) => `${data.productCode}-${String(i + 1).padStart(2, "0")}`
    );
  };

  const skuPreviews = generateSKUPreview();

  return (
    <div className="space-y-6">
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productCode">Mã sản phẩm (Product Code) *</Label>
          <Input
            id="productCode"
            value={data.productCode}
            onChange={(e) =>
            onChange({ productCode: e.target.value.toUpperCase() })
            }
            placeholder="VD: SKU-2024-001" />
          
          <p className="text-xs text-muted-foreground">
            Mã định danh duy nhất cho sản phẩm
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="productName">Tên sản phẩm *</Label>
          <Input
            id="productName"
            value={data.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="VD: Áo T-shirt Organic Cotton" />
          
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Loại sản phẩm *</Label>
          <Select
            value={data.productType}
            onValueChange={(v) => onChange({ productType: v })}>
            
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại sản phẩm" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((type) =>
              <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightPerUnit">
            Trọng lượng TB / sản phẩm (gram) *
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
            placeholder="VD: 250" />
          
          <p className="text-xs text-muted-foreground">
            Trọng lượng trung bình của 1 sản phẩm hoàn thiện
          </p>
        </div>
      </div>

      
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-base font-semibold">
                  Số lượng sản xuất *
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Hệ thống sẽ tự động tạo các SKU instance để theo dõi theo lô
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
                  placeholder="VD: 30"
                  className="text-lg font-medium" />
                
              </div>

              
              {skuPreviews.length > 0 &&
              <div className="pt-2">
                  <p className="text-sm font-medium mb-2">
                    SKU instances sẽ được tạo:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skuPreviews.map((sku, i) =>
                  <span
                    key={i}
                    className="px-2 py-1 bg-background rounded border text-xs font-mono">
                    
                        {sku}
                      </span>
                  )}
                    {data.quantity > 5 &&
                  <span className="px-2 py-1 text-xs text-muted-foreground">
                        ... và {data.quantity - 5} SKU khác
                      </span>
                  }
                  </div>
                </div>
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default Step1SKUInfo;