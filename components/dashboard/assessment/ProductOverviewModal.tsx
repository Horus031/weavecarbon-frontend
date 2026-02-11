"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Leaf,
  Scale,
  MapPin,
  Truck,
  Recycle,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useProducts, DashboardProduct } from "@/contexts/ProductContext";

// Treatment factors by material (kg CO2e per kg)
const MATERIAL_FACTORS: Record<string, number> = {
  cotton: 8.0,
  polyester: 5.5,
  wool: 10.1,
  silk: 7.5,
  linen: 5.2,
  nylon: 6.8,
  recycled_polyester: 2.5,
  organic_cotton: 4.5,
  bamboo: 3.8,
  hemp: 2.9,
};

// Regional energy factors (multiplier)
const REGION_FACTORS: Record<string, number> = {
  Vietnam: 1.0,
  China: 1.2,
  India: 1.1,
  Bangladesh: 1.05,
  EU: 0.75,
  US: 0.85,
};

// Energy source factors (multiplier)
const ENERGY_FACTORS: Record<string, number> = {
  grid: 1.0,
  solar: 0.4,
  wind: 0.35,
  mixed: 0.7,
  coal: 1.5,
};

// Transport mode factors (kg CO2e per kg per 1000km)
const TRANSPORT_FACTORS: Record<string, number> = {
  sea: 0.016,
  air: 0.602,
  road: 0.089,
  rail: 0.028,
  multimodal: 0.05,
};

// Packaging factors (kg CO2e per kg)
const PACKAGING_FACTORS: Record<string, number> = {
  plastic: 3.0,
  paper: 1.5,
  biodegradable: 0.8,
  recycled: 0.5,
  minimal: 0.3,
};

interface ProductData {
  productName: string;
  productCode: string;
  category: string;
  description: string;
  weight: string;
  unit: string;
  primaryMaterial: string;
  materialPercentage: string;
  secondaryMaterial: string;
  secondaryPercentage: string;
  recycledContent: string;
  certifications: string[];
  manufacturingLocation: string;
  energySource: string;
  processType: string;
  wasteRecovery: string;
  originCountry: string;
  destinationMarket: string;
  transportMode: string;
  packagingType: string;
  packagingWeight: string;
}

interface CarbonBreakdown {
  materials: number;
  manufacturing: number;
  transport: number;
  packaging: number;
  total: number;
}

interface ProductOverviewModalProps {
  open: boolean;
  onClose: () => void;
  productData: ProductData;
}

const MATERIAL_LABELS: Record<string, string> = {
  cotton: "Cotton",
  polyester: "Polyester",
  wool: "Wool",
  silk: "Silk",
  linen: "Linen",
  nylon: "Nylon",
  recycled_polyester: "Recycled Polyester",
  organic_cotton: "Organic Cotton",
  bamboo: "Bamboo",
  hemp: "Hemp",
};

const MARKET_LABELS: Record<string, string> = {
  eu: "Châu Âu (EU)",
  us: "Hoa Kỳ",
  jp: "Nhật Bản",
  kr: "Hàn Quốc",
  domestic: "Nội địa Việt Nam",
};

const TRANSPORT_LABELS: Record<string, string> = {
  sea: "Đường biển",
  air: "Đường hàng không",
  road: "Đường bộ",
  rail: "Đường sắt",
  multimodal: "Đa phương thức",
};

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Quần áo",
  footwear: "Giày dép",
  accessories: "Phụ kiện",
  textiles: "Vải textile",
  homegoods: "Đồ gia dụng",
};

// Estimated distances from Vietnam to markets (km)
const MARKET_DISTANCES: Record<string, number> = {
  eu: 10000,
  us: 14000,
  jp: 3500,
  kr: 3200,
  domestic: 500,
};

const calculateCarbonFootprint = (data: ProductData): CarbonBreakdown => {
  // Convert weight to kg
  let weightKg = parseFloat(data.weight) || 0;
  if (data.unit === "g") weightKg = weightKg / 1000;
  if (data.unit === "lb") weightKg = weightKg * 0.453592;

  const packagingWeightKg = parseFloat(data.packagingWeight) || 0;
  const primaryPercentage = (parseFloat(data.materialPercentage) || 100) / 100;
  const secondaryPercentage = (parseFloat(data.secondaryPercentage) || 0) / 100;
  const recycledPercentage = (parseFloat(data.recycledContent) || 0) / 100;

  // 1. Materials CO2e = Weight × Material Factor × (1 - recycled discount)
  const primaryFactor = MATERIAL_FACTORS[data.primaryMaterial] || 5.0;
  const secondaryFactor = MATERIAL_FACTORS[data.secondaryMaterial] || 0;
  const recycledDiscount = recycledPercentage * 0.5; // 50% reduction for recycled content

  const materialsCO2 =
    weightKg *
    (primaryFactor * primaryPercentage +
      secondaryFactor * secondaryPercentage) *
    (1 - recycledDiscount);

  // 2. Manufacturing CO2e = Weight × Energy Factor × Region Factor × Base manufacturing
  const energyFactor = ENERGY_FACTORS[data.energySource] || 1.0;
  const regionFactor =
    REGION_FACTORS[data.originCountry] || REGION_FACTORS["Vietnam"];
  const baseManufacturing = 2.5; // Base kg CO2e per kg product
  const manufacturingCO2 =
    weightKg * baseManufacturing * energyFactor * regionFactor;

  // 3. Transport CO2e = Weight × Distance × Transport Factor
  const distance = MARKET_DISTANCES[data.destinationMarket] || 5000;
  const transportFactor = TRANSPORT_FACTORS[data.transportMode] || 0.05;
  const transportCO2 = weightKg * (distance / 1000) * transportFactor;

  // 4. Packaging CO2e = Packaging Weight × Packaging Factor
  const packagingFactor = PACKAGING_FACTORS[data.packagingType] || 1.5;
  const packagingCO2 = packagingWeightKg * packagingFactor;

  const total = materialsCO2 + manufacturingCO2 + transportCO2 + packagingCO2;

  return {
    materials: Math.round(materialsCO2 * 100) / 100,
    manufacturing: Math.round(manufacturingCO2 * 100) / 100,
    transport: Math.round(transportCO2 * 100) / 100,
    packaging: Math.round(packagingCO2 * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

const ProductOverviewModal: React.FC<ProductOverviewModalProps> = ({
  open,
  onClose,
  productData,
}) => {
  const router = useRouter();
  const { addProduct, lastCreatedProduct } = useProducts();
  const carbonBreakdown = calculateCarbonFootprint(productData);

  // Add product to store when modal opens
  useEffect(() => {
    if (open && productData.productName) {
      // Convert weight to kg for storage
      let weightKg = parseFloat(productData.weight) || 0;
      if (productData.unit === "g") weightKg = weightKg / 1000;
      if (productData.unit === "lb") weightKg = weightKg * 0.453592;

      const newProduct: Omit<DashboardProduct, "id" | "createdAt"> = {
        name: productData.productName,
        sku:
          productData.productCode || `SKU-${Date.now().toString().slice(-6)}`,
        category: productData.category,
        co2: carbonBreakdown.total,
        status: "draft",
        materials: [
          `${MATERIAL_LABELS[productData.primaryMaterial] || productData.primaryMaterial} ${productData.materialPercentage}%`,
          ...(productData.secondaryMaterial
            ? [
                `${MATERIAL_LABELS[productData.secondaryMaterial]} ${productData.secondaryPercentage}%`,
              ]
            : []),
        ],
        weight: weightKg,
        unit: "kg",
        scope: "scope1",
        confidenceScore: 45, // Low confidence for draft
      };

      addProduct(newProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Calculate percentage for each category
  const getPercentage = (value: number) => {
    if (carbonBreakdown.total === 0) return 0;
    return Math.round((value / carbonBreakdown.total) * 100);
  };

  const handleViewDetail = () => {
    onClose();
    if (lastCreatedProduct) {
      router.push(`/summary/${lastCreatedProduct.id}`);
    } else {
      router.push("/products");
    }
  };

  const handleGoToDashboard = () => {
    onClose();
    router.push("/products");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Tạo sản phẩm thành công!
              </DialogTitle>
              <DialogDescription>
                Sản phẩm đã được thêm vào danh sách. Dưới đây là ước tính Carbon
                Footprint ban đầu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Product Info Section */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    {productData.productName || "Sản phẩm mới"}
                  </h3>
                  {productData.productCode && (
                    <p className="text-sm text-muted-foreground">
                      SKU: {productData.productCode}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  Nháp
                </Badge>
                <Badge variant="secondary">
                  {CATEGORY_LABELS[productData.category] ||
                    productData.category}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <span>
                  Trọng lượng: {productData.weight} {productData.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-muted-foreground" />
                <span>
                  {MATERIAL_LABELS[productData.primaryMaterial] ||
                    productData.primaryMaterial}{" "}
                  ({productData.materialPercentage}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {productData.manufacturingLocation ||
                    productData.originCountry}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span>
                  {TRANSPORT_LABELS[productData.transportMode]} →{" "}
                  {MARKET_LABELS[productData.destinationMarket]}
                </span>
              </div>
            </div>

            {productData.certifications.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Recycle className="w-4 h-4 text-green-600" />
                <div className="flex gap-1">
                  {productData.certifications.map((cert) => (
                    <Badge
                      key={cert}
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      {cert.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Carbon Footprint Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Ước tính Carbon Footprint (Scope 1)
              </h4>
              <Badge
                variant="outline"
                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                Preliminary
              </Badge>
            </div>

            {/* Total CO2e */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {carbonBreakdown.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  kg CO₂e / đơn vị sản phẩm
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Vật liệu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {carbonBreakdown.materials} kg
                  </span>
                  <span className="text-muted-foreground">
                    ({getPercentage(carbonBreakdown.materials)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={getPercentage(carbonBreakdown.materials)}
                className="h-2"
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Sản xuất</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {carbonBreakdown.manufacturing} kg
                  </span>
                  <span className="text-muted-foreground">
                    ({getPercentage(carbonBreakdown.manufacturing)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={getPercentage(carbonBreakdown.manufacturing)}
                className="h-2"
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Vận chuyển</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {carbonBreakdown.transport} kg
                  </span>
                  <span className="text-muted-foreground">
                    ({getPercentage(carbonBreakdown.transport)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={getPercentage(carbonBreakdown.transport)}
                className="h-2"
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Bao bì</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {carbonBreakdown.packaging} kg
                  </span>
                  <span className="text-muted-foreground">
                    ({getPercentage(carbonBreakdown.packaging)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={getPercentage(carbonBreakdown.packaging)}
                className="h-2"
              />
            </div>

            {/* Formula note */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Công thức tính:</p>
              <p>
                CO₂e = Weight × Treatment Factor (material & region) × Energy
                Factor
              </p>
              <p className="mt-2 text-yellow-600">
                ⚠️ Đây là ước tính ban đầu. Bổ sung thêm dữ liệu để tăng độ
                chính xác.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleGoToDashboard}>
            Xem danh sách sản phẩm
          </Button>
          <Button onClick={handleViewDetail} className="gap-2">
            Xem chi tiết
            <ExternalLink className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOverviewModal;
