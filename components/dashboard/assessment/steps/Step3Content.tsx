
import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Factory, Zap, AlertTriangle, Info } from "lucide-react";
import {
  ProductAssessmentData,
  EnergySourceInput,
  PRODUCTION_PROCESSES,
  ENERGY_SOURCES } from
"./types";
import { getMaterialById, MATERIAL_CATALOG } from "../materialCatalog";

interface Step3ProductionEnergyProps {
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

const Step3ProductionEnergy: React.FC<Step3ProductionEnergyProps> = ({
  data,
  onChange
}) => {

  const materialWarnings = useMemo(() => {
    const warnings: {type: "info" | "warning";message: string;}[] = [];

    data.materials.forEach((mat) => {
      const extMat = mat as ExtendedMaterialInput;
      const catalogMat = extMat.catalogMaterialId ?
      getMaterialById(extMat.catalogMaterialId) :
      MATERIAL_CATALOG.find((m) => m.id === mat.materialType);

      if (catalogMat) {

        if (["leather", "down", "fur"].includes(catalogMat.materialFamily)) {
          warnings.push({
            type: "info",
            message: `Vật liệu "${catalogMat.displayNameVi}" có thể yêu cầu chứng nhận phúc lợi động vật (welfare certification) cho một số thị trường.`
          });
        }


        if (catalogMat.materialFamily === "metal" && mat.percentage > 5) {
          warnings.push({
            type: "warning",
            message: `Phụ liệu kim loại chiếm ${mat.percentage}% - hệ số phát thải cao, cân nhắc giảm tỷ lệ hoặc dùng vật liệu tái chế.`
          });
        }
      }


      if (extMat.userSource === "user_other") {
        warnings.push({
          type: "warning",
          message: `Vật liệu "${extMat.customName || "Khác"}" đang dùng hệ số proxy - độ chính xác carbon sẽ giảm.`
        });
      }


      if (mat.source === "unknown") {
        warnings.push({
          type: "info",
          message: `Nguồn gốc vật liệu không xác định - hệ thống sẽ dùng hệ số trung bình ngành.`
        });
      }
    });


    const accessoriesWithoutWeight = data.accessories.filter(
      (a) => a.type && !a.weight
    );
    if (accessoriesWithoutWeight.length > 0) {
      warnings.push({
        type: "info",
        message: `${accessoriesWithoutWeight.length} phụ liệu chưa có trọng lượng - có thể ảnh hưởng độ chính xác.`
      });
    }

    return warnings;
  }, [data.materials, data.accessories]);

  const toggleProcess = (processValue: string) => {
    const current = data.productionProcesses || [];
    const updated = current.includes(processValue) ?
    current.filter((p) => p !== processValue) :
    [...current, processValue];
    onChange({ productionProcesses: updated });
  };


  const toggleEnergySource = (sourceValue: string) => {
    const current = data.energySources || [];
    const exists = current.find((e) => e.source === sourceValue);

    if (exists) {

      const updated = current.filter((e) => e.source !== sourceValue);

      if (updated.length > 0) {
        const perSource = Math.floor(100 / updated.length);
        const remainder = 100 - perSource * updated.length;
        updated.forEach((e, i) => {
          e.percentage = perSource + (i === 0 ? remainder : 0);
        });
      }
      onChange({ energySources: updated });
    } else {

      const newSource: EnergySourceInput = {
        id: `energy-${Date.now()}`,
        source: sourceValue,
        percentage: 0
      };
      const updated = [...current, newSource];

      const perSource = Math.floor(100 / updated.length);
      const remainder = 100 - perSource * updated.length;
      updated.forEach((e, i) => {
        e.percentage = perSource + (i === 0 ? remainder : 0);
      });
      onChange({ energySources: updated });
    }
  };


  const updateEnergyPercentage = (sourceValue: string, percentage: number) => {
    const updated = data.energySources.map((e) =>
    e.source === sourceValue ? { ...e, percentage } : e
    );
    onChange({ energySources: updated });
  };


  const totalEnergyPercentage = data.energySources.reduce(
    (sum, e) => sum + (e.percentage || 0),
    0
  );
  const isValidEnergyTotal = totalEnergyPercentage === 100;


  const isSourceSelected = (sourceValue: string) =>
  data.energySources.some((e) => e.source === sourceValue);

  return (
    <div className="space-y-6">
      
      {materialWarnings.length > 0 &&
      <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-base text-yellow-700">
                Lưu ý từ vật liệu (Step 2)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {materialWarnings.map((warning, index) =>
          <div
            key={index}
            className={`flex items-start gap-2 text-sm ${
            warning.type === "warning" ?
            "text-yellow-700" :
            "text-muted-foreground"}`
            }>
            
                {warning.type === "warning" ?
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-yellow-600" /> :

            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            }
                <span>{warning.message}</span>
              </div>
          )}
          </CardContent>
        </Card>
      }

      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Factory className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Quy trình sản xuất</CardTitle>
              <p className="text-sm text-muted-foreground">
                Chọn tất cả các công đoạn áp dụng
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCTION_PROCESSES.map((process) =>
            <label
              key={process.value}
              className={`
                  flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors
                  ${
              data.productionProcesses?.includes(process.value) ?
              "bg-primary/5 border-primary/30" :
              "bg-card hover:bg-muted/50"}
                `
              }>
              
                <Checkbox
                checked={data.productionProcesses?.includes(process.value)}
                onCheckedChange={() => toggleProcess(process.value)} />
              
                <div>
                  <p className="font-medium">{process.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Hệ số: {process.co2Factor} kg CO₂e/kg
                  </p>
                </div>
              </label>
            )}
          </div>

          {(!data.productionProcesses ||
          data.productionProcesses.length === 0) &&
          <p className="text-sm text-muted-foreground mt-4">
              * Vui lòng chọn ít nhất 1 quy trình sản xuất
            </p>
          }
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Nguồn năng lượng</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chọn và phân bổ % cho từng nguồn
                </p>
              </div>
            </div>
            {data.energySources.length > 0 &&
            <div
              className={`text-sm font-medium ${isValidEnergyTotal ? "text-green-600" : "text-yellow-600"}`}>
              
                Tổng: {totalEnergyPercentage}%
              </div>
            }
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ENERGY_SOURCES.map((source) =>
            <label
              key={source.value}
              className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${
              isSourceSelected(source.value) ?
              "bg-yellow-500/5 border-yellow-500/30" :
              "bg-card hover:bg-muted/50"}
                `
              }>
              
                <Checkbox
                checked={isSourceSelected(source.value)}
                onCheckedChange={() => toggleEnergySource(source.value)} />
              
                <div className="flex-1">
                  <p className="font-medium text-sm">{source.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.co2Factor} kg CO₂e/kWh
                  </p>
                </div>
              </label>
            )}
          </div>

          
          {data.energySources.length > 1 &&
          <div className="mt-6 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-4">
                Phân bổ tỷ lệ sử dụng (tổng = 100%)
              </p>
              <div className="space-y-4">
                {data.energySources.map((energy) => {
                const sourceInfo = ENERGY_SOURCES.find(
                  (s) => s.value === energy.source
                );
                return (
                  <div key={energy.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{sourceInfo?.label}</span>
                        <div className="flex items-center gap-2">
                          <Input
                          type="number"
                          min="0"
                          max="100"
                          value={energy.percentage}
                          onChange={(e) =>
                          updateEnergyPercentage(
                            energy.source,
                            Number(e.target.value)
                          )
                          }
                          className="w-20 h-8 text-sm" />
                        
                          <span className="text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <Progress value={energy.percentage} className="h-2" />
                    </div>);

              })}
              </div>

              {!isValidEnergyTotal &&
            <div className="mt-4 flex items-center gap-2 text-yellow-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Tổng tỷ lệ phải bằng 100%</span>
                </div>
            }
            </div>
          }
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Thông tin bổ sung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Địa điểm sản xuất</Label>
              <Input
                value={data.manufacturingLocation}
                onChange={(e) =>
                onChange({ manufacturingLocation: e.target.value })
                }
                placeholder="VD: TP. Hồ Chí Minh, Vietnam" />
              
            </div>
            <div className="space-y-2">
              <Label>Thu hồi chất thải</Label>
              <Select
                value={data.wasteRecovery}
                onValueChange={(v) => onChange({ wasteRecovery: v })}>
                
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  <SelectItem value="partial">Một phần</SelectItem>
                  <SelectItem value="full">Toàn bộ</SelectItem>
                  <SelectItem value="circular">Tuần hoàn (Circular)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default Step3ProductionEnergy;