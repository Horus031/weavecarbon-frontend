import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  Factory,
  Zap,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingDown,
  Sparkles } from
"lucide-react";
import {
  ProductAssessmentData,
  CarbonAssessmentResult,
  PRODUCTION_PROCESSES,
  ENERGY_SOURCES,
  TRANSPORT_MODES } from
"./types";
import {
  getMaterialById,
  MATERIAL_CATALOG } from
"../materialCatalog";

interface Step5CarbonResultProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}


interface ExtendedMaterialInput {
  id: string;
  materialType: string;
  percentage: number;
  source: "domestic" | "imported" | "unknown";
  certifications: string[];
  catalogMaterialId?: string;
  customName?: string;
  userSource?: "selected_catalog" | "ai_suggested" | "user_other";
  confidenceScore?: number;
}


const calculateCarbonAssessment = (
data: ProductAssessmentData)
: CarbonAssessmentResult => {
  const proxyNotes: string[] = [];
  let confidenceLevel: "high" | "medium" | "low" = "high";

  const weightKg = (data.weightPerUnit || 0) / 1000;
  const quantity = data.quantity || 1;


  let materialsCO2 = 0;
  data.materials.forEach((mat) => {
    const extMat = mat as ExtendedMaterialInput;


    let co2Factor = 6.0;
    const catalogMat = extMat.catalogMaterialId ?
    getMaterialById(extMat.catalogMaterialId) :
    MATERIAL_CATALOG.find((m) => m.id === mat.materialType);

    if (catalogMat) {
      co2Factor = catalogMat.co2Factor;


      if (catalogMat.dataQualityDefault === "proxy") {
        proxyNotes.push(
          `Vật liệu "${catalogMat.displayNameVi}" sử dụng hệ số proxy`
        );
        confidenceLevel =
        confidenceLevel === "high" ? "medium" : confidenceLevel;
      }
    } else {
      proxyNotes.push(
        `Vật liệu "${extMat.customName || mat.materialType}" không trong danh mục - dùng hệ số proxy`
      );
      confidenceLevel = confidenceLevel === "high" ? "medium" : confidenceLevel;
    }


    if (extMat.userSource === "user_other") {
      proxyNotes.push(
        `Vật liệu tùy chỉnh "${extMat.customName}" - độ tin cậy thấp`
      );
      confidenceLevel = "low";
    } else if (extMat.userSource === "ai_suggested") {
      confidenceLevel = confidenceLevel === "high" ? "medium" : confidenceLevel;
    }

    const contribution = weightKg * (mat.percentage / 100) * co2Factor;
    materialsCO2 += contribution;

    if (mat.source === "unknown") {
      proxyNotes.push(`Nguồn vật liệu không xác định - dùng hệ số vùng proxy`);
      confidenceLevel = confidenceLevel === "high" ? "medium" : confidenceLevel;
    }
  });


  let productionCO2 = 0;
  if (data.productionProcesses && data.productionProcesses.length > 0) {
    data.productionProcesses.forEach((proc) => {
      const procInfo = PRODUCTION_PROCESSES.find((p) => p.value === proc);
      if (procInfo) {
        productionCO2 += weightKg * procInfo.co2Factor;
      }
    });
  } else {

    productionCO2 = weightKg * 1.5;
    proxyNotes.push(
      "Không có thông tin quy trình - dùng hệ số trung bình ngành"
    );
    confidenceLevel = "low";
  }


  let energyCO2 = 0;
  if (data.energySources && data.energySources.length > 0) {
    data.energySources.forEach((energy) => {
      const energyInfo = ENERGY_SOURCES.find((e) => e.value === energy.source);
      if (energyInfo) {

        const kwhPerUnit = weightKg * 2;
        energyCO2 +=
        kwhPerUnit * energyInfo.co2Factor * (energy.percentage / 100);
      }
    });
  } else {

    energyCO2 = weightKg * 2 * 1.0;
    proxyNotes.push("Không có thông tin năng lượng - dùng hệ số điện lưới");
    confidenceLevel = confidenceLevel === "high" ? "medium" : "low";
  }


  let transportCO2 = 0;
  if (data.transportLegs && data.transportLegs.length > 0) {
    data.transportLegs.forEach((leg) => {
      const modeInfo = TRANSPORT_MODES.find((m) => m.value === leg.mode);
      if (modeInfo && leg.estimatedDistance) {

        const weightTonnes = weightKg / 1000;
        transportCO2 +=
        weightTonnes * leg.estimatedDistance * modeInfo.co2Factor;
      }
    });
  } else if (data.estimatedTotalDistance) {

    const weightTonnes = weightKg / 1000;
    transportCO2 = weightTonnes * data.estimatedTotalDistance * 0.016;
    proxyNotes.push("Ước tính vận chuyển bằng đường biển");
  }


  const totalPerProduct =
  materialsCO2 + productionCO2 + energyCO2 + transportCO2;


  const scope1 = productionCO2 * 0.3;
  const scope2 = energyCO2;
  const scope3 = materialsCO2 + transportCO2 + productionCO2 * 0.7;


  const uniqueProxyNotes = [...new Set(proxyNotes)];

  return {
    perProduct: {
      materials: Math.round(materialsCO2 * 1000) / 1000,
      production: Math.round(productionCO2 * 1000) / 1000,
      energy: Math.round(energyCO2 * 1000) / 1000,
      transport: Math.round(transportCO2 * 1000) / 1000,
      total: Math.round(totalPerProduct * 1000) / 1000
    },
    totalBatch: {
      materials: Math.round(materialsCO2 * quantity * 100) / 100,
      production: Math.round(productionCO2 * quantity * 100) / 100,
      energy: Math.round(energyCO2 * quantity * 100) / 100,
      transport: Math.round(transportCO2 * quantity * 100) / 100,
      total: Math.round(totalPerProduct * quantity * 100) / 100
    },
    confidenceLevel,
    proxyUsed: uniqueProxyNotes.length > 0,
    proxyNotes: uniqueProxyNotes,
    scope1: Math.round(scope1 * quantity * 100) / 100,
    scope2: Math.round(scope2 * quantity * 100) / 100,
    scope3: Math.round(scope3 * quantity * 100) / 100
  };
};
const Step5CarbonResult: React.FC<Step5CarbonResultProps> = ({
  data,
  onChange
}) => {
  const currentSerialized = useMemo(
    () => JSON.stringify(data.carbonResults ?? null),
    [data.carbonResults]
  );


  const result = useMemo(() => calculateCarbonAssessment(data), [data]);
  const resultSerialized = useMemo(() => JSON.stringify(result), [result]);


  React.useEffect(() => {
    if (currentSerialized === resultSerialized) {
      return;
    }
    onChange({ carbonResults: result });
  }, [currentSerialized, onChange, result, resultSerialized]);


  const breakdownItems = [
  {
    label: "Nguyên vật liệu",
    icon: Leaf,
    value: result.perProduct.materials,
    total: result.totalBatch.materials,
    color: "bg-green-500",
    percentage: result.perProduct.materials / result.perProduct.total * 100
  },
  {
    label: "Sản xuất",
    icon: Factory,
    value: result.perProduct.production,
    total: result.totalBatch.production,
    color: "bg-blue-500",
    percentage:
    result.perProduct.production / result.perProduct.total * 100
  },
  {
    label: "Năng lượng",
    icon: Zap,
    value: result.perProduct.energy,
    total: result.totalBatch.energy,
    color: "bg-yellow-500",
    percentage: result.perProduct.energy / result.perProduct.total * 100
  },
  {
    label: "Vận chuyển",
    icon: Truck,
    value: result.perProduct.transport,
    total: result.totalBatch.transport,
    color: "bg-purple-500",
    percentage: result.perProduct.transport / result.perProduct.total * 100
  }];



  const confidenceBadgeStyle = {
    high: "bg-green-500/10 text-green-600 border-green-500/30",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    low: "bg-red-500/10 text-red-600 border-red-500/30"
  };

  const confidenceLabel = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp"
  };

  return (
    <div className="space-y-6">
      
      <div className="grid md:grid-cols-2 gap-6">
        
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">CO₂e / Sản phẩm</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {result.perProduct.total.toFixed(3)}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                kg CO₂e
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Cho 1 sản phẩm ({data.weightPerUnit || 0}g)
            </p>
          </CardContent>
        </Card>

        
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Tổng lô hàng</CardTitle>
              </div>
              <Badge variant="outline">
                {data.quantity?.toLocaleString()} sản phẩm
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {result.totalBatch.total.toFixed(2)}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                kg CO₂e
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              ≈ {(result.totalBatch.total / 1000).toFixed(3)} tấn CO₂e
            </p>
          </CardContent>
        </Card>
      </div>

      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Phân tích chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdownItems.map((item, index) =>
          <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">
                    {item.value.toFixed(3)} kg
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                Tổng lô: {item.total.toFixed(2)} kg CO₂e
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Chi tiết vật liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.materials.map((mat, index) => {
              const extMat = mat as ExtendedMaterialInput;
              const catalogMat = extMat.catalogMaterialId ?
              getMaterialById(extMat.catalogMaterialId) :
              MATERIAL_CATALOG.find((m) => m.id === mat.materialType);

              const materialName =
              extMat.customName ||
              catalogMat?.displayNameVi ||
              mat.materialType ||
              "Vật liệu";
              const co2Factor = catalogMat?.co2Factor || 6.0;
              const weightKg = (data.weightPerUnit || 0) / 1000;
              const materialCO2 = weightKg * (mat.percentage / 100) * co2Factor;

              return (
                <div
                  key={mat.id || index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {materialName}
                        </span>
                        {extMat.userSource === "selected_catalog" &&
                        <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Từ danh mục
                          </Badge>
                        }
                        {extMat.userSource === "ai_suggested" &&
                        <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI gợi ý
                          </Badge>
                        }
                        {extMat.userSource === "user_other" &&
                        <Badge
                          variant="outline"
                          className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                          
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Proxy
                          </Badge>
                        }
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mat.percentage}% • Hệ số: {co2Factor} kg CO₂e/kg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">
                      {materialCO2.toFixed(4)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      kg CO₂e
                    </span>
                  </div>
                </div>);

            })}
          </div>

          {data.materials.some(
            (m) => (m as ExtendedMaterialInput).userSource === "user_other"
          ) &&
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Một số vật liệu đang dùng hệ số ước tính (proxy). Kết quả
                  carbon có độ tin cậy thấp hơn.
                </p>
              </div>
            </div>
          }
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            Phân tách Scope (GHG Protocol)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
              <p className="text-xs font-medium text-blue-600 mb-1">Scope 1</p>
              <p className="text-lg font-bold">{result.scope1.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂e</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
              <p className="text-xs font-medium text-green-600 mb-1">Scope 2</p>
              <p className="text-lg font-bold">{result.scope2.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂e</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 text-center">
              <p className="text-xs font-medium text-purple-600 mb-1">
                Scope 3
              </p>
              <p className="text-lg font-bold">{result.scope3.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂e</p>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Độ tin cậy dữ liệu</CardTitle>
            <Badge
              variant="outline"
              className={confidenceBadgeStyle[result.confidenceLevel]}>
              
              {result.confidenceLevel === "high" &&
              <CheckCircle2 className="w-3 h-3 mr-1" />
              }
              {result.confidenceLevel === "medium" &&
              <Info className="w-3 h-3 mr-1" />
              }
              {result.confidenceLevel === "low" &&
              <AlertCircle className="w-3 h-3 mr-1" />
              }
              {confidenceLabel[result.confidenceLevel]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {result.proxyUsed ?
          <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Một số hệ số proxy đã được sử dụng:
              </p>
              <ul className="text-sm space-y-1">
                {result.proxyNotes.map((note, i) =>
              <li
                key={i}
                className="flex items-start gap-2 text-yellow-600">
                
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{note}</span>
                  </li>
              )}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                * Bổ sung thông tin chi tiết để tăng độ chính xác của kết quả
              </p>
            </div> :

          <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">
                Đủ dữ liệu - Kết quả có độ tin cậy cao
              </span>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default Step5CarbonResult;