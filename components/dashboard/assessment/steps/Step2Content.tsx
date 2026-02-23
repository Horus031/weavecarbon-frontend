import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  ProductAssessmentData,
  MaterialInput,
  CERTIFICATIONS,
  ACCESSORY_TYPES,
  AccessoryInput,
} from "./types";
import MaterialCombobox from "../MaterialCombobox";
import OtherMaterialModal from "../OtherMaterialModal";
import { CatalogMaterial, MaterialType } from "../materialCatalog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Step2MaterialsProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}

// Extended material input with catalog support
interface ExtendedMaterialInput extends MaterialInput {
  catalogMaterialId?: string;
  customName?: string;
  userSource?: "selected_catalog" | "ai_suggested" | "user_other";
  confidenceScore?: number;
}

const MATERIAL_SOURCES = [
  { value: "domestic", labelKey: "sourceDomestic" },
  { value: "imported", labelKey: "sourceImported" },
  { value: "unknown", labelKey: "sourceUnknown" },
] as const;

const Step2Materials: React.FC<Step2MaterialsProps> = ({ data, onChange }) => {
  const t = useTranslations("assessment.step2");
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<
    number | null
  >(null);

  // Calculate total percentage
  const totalPercentage = data.materials.reduce(
    (sum, m) => sum + (m.percentage || 0),
    0,
  );
  const isValidTotal = totalPercentage === 100;
  const hasProxySource = data.materials.some(
    (m) =>
      m.source === "unknown" ||
      (m as ExtendedMaterialInput).userSource === "user_other",
  );

  // Add new material
  const addMaterial = () => {
    const newMaterial: ExtendedMaterialInput = {
      id: `mat-${Date.now()}`,
      materialType: "",
      percentage: 0,
      source: "domestic",
      certifications: [],
      userSource: "selected_catalog",
      confidenceScore: 1.0,
    };
    onChange({ materials: [...data.materials, newMaterial] });
  };

  // Remove material
  const removeMaterial = (id: string) => {
    onChange({ materials: data.materials.filter((m) => m.id !== id) });
  };

  // Update material
  const updateMaterial = (
    id: string,
    updates: Partial<ExtendedMaterialInput>,
  ) => {
    onChange({
      materials: data.materials.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    });
  };

  // Handle catalog material selection
  const handleCatalogSelect = (
    materialId: string,
    catalogMaterial: CatalogMaterial | null,
  ) => {
    if (catalogMaterial) {
      updateMaterial(materialId, {
        materialType: catalogMaterial.id, // Store catalog ID as materialType for carbon calculation
        catalogMaterialId: catalogMaterial.id,
        customName: undefined,
        userSource: "selected_catalog",
        confidenceScore: 1.0,
      });
    }
  };

  // Handle "Other" material modal
  const handleOtherClick = (index: number) => {
    setEditingMaterialIndex(index);
    setOtherModalOpen(true);
  };

  const handleOtherMaterialSelect = (
    catalogMaterial: CatalogMaterial | null,
    customData?: {
      name: string;
      description: string;
      materialType: MaterialType;
      confidenceScore: number;
      isProxy: boolean;
    },
  ) => {
    if (editingMaterialIndex === null) return;

    const materialId = data.materials[editingMaterialIndex]?.id;
    if (!materialId) return;

    if (catalogMaterial) {
      // AI suggested a catalog material
      updateMaterial(materialId, {
        materialType: catalogMaterial.id,
        catalogMaterialId: catalogMaterial.id,
        customName: undefined,
        userSource: "ai_suggested",
        confidenceScore: 0.75,
      });
    } else if (customData) {
      // User created a proxy material
      updateMaterial(materialId, {
        materialType: "cat-other-generic", // Use generic proxy
        catalogMaterialId: "cat-other-generic",
        customName: customData.name,
        userSource: "user_other",
        confidenceScore: customData.confidenceScore,
      });
    }

    setEditingMaterialIndex(null);
  };

  // Toggle certification for a material
  const toggleCertification = (materialId: string, certValue: string) => {
    const material = data.materials.find((m) => m.id === materialId);
    if (!material) return;

    const certs = material.certifications || [];
    const updated = certs.includes(certValue)
      ? certs.filter((c) => c !== certValue)
      : [...certs, certValue];

    updateMaterial(materialId, { certifications: updated });
  };

  // Get display name for material
  // const getMaterialDisplayName = (material: ExtendedMaterialInput): string => {
  //   if (material.customName) return material.customName;
  //   if (material.catalogMaterialId) {
  //     const catalogMat = getMaterialById(material.catalogMaterialId);
  //     return catalogMat?.displayNameVi || material.materialType;
  //   }
  //   // Legacy: try to find by materialType
  //   const legacyMat = MATERIAL_CATALOG.find(
  //     (m) => m.id === material.materialType,
  //   );
  //   return legacyMat?.displayNameVi || material.materialType || "Chưa chọn";
  // };

  // Get source badge
  const getSourceBadge = (material: ExtendedMaterialInput) => {
    switch (material.userSource) {
      case "ai_suggested":
        return (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {t("aiSuggested")}
          </Badge>
        );
      case "user_other":
        return (
          <Badge
            variant="outline"
            className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            {t("proxy")}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Add accessory
  const addAccessory = () => {
    const newAccessory: AccessoryInput = {
      id: `acc-${Date.now()}`,
      name: "",
      type: "",
      weight: undefined,
    };
    onChange({ accessories: [...data.accessories, newAccessory] });
  };

  // Remove accessory
  const removeAccessory = (id: string) => {
    onChange({ accessories: data.accessories.filter((a) => a.id !== id) });
  };

  // Update accessory
  const updateAccessory = (id: string, updates: Partial<AccessoryInput>) => {
    onChange({
      accessories: data.accessories.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Materials Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{t("mainMaterials")}</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      {t("materialTooltip")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {isValidTotal ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/30"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t("totalValid", { total: totalPercentage })}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {t("totalInvalid", { total: totalPercentage })}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.materials.map((material, index) => {
              const extMaterial = material as ExtendedMaterialInput;
              return (
                <div
                  key={material.id}
                  className="p-4 rounded-lg border bg-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("materialIndex", { index: index + 1 })}
                      </span>
                      {getSourceBadge(extMaterial)}
                    </div>
                    {data.materials.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(material.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>{t("findMaterial")}</Label>
                      <MaterialCombobox
                        value={
                          extMaterial.catalogMaterialId ||
                          extMaterial.materialType
                        }
                        onSelect={(catalogMat) =>
                          handleCatalogSelect(material.id, catalogMat)
                        }
                        onOtherClick={() => handleOtherClick(index)}
                        placeholder={
                          extMaterial.customName || t("searchMaterial")
                        }
                      />
                      {extMaterial.customName && (
                        <p className="text-xs text-muted-foreground">
                          {t("customMaterial", { name: extMaterial.customName })}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t("percentage")}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={material.percentage || ""}
                        onChange={(e) =>
                          updateMaterial(material.id, {
                            percentage: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("materialSource")}</Label>
                      <Select
                        value={material.source}
                        onValueChange={(
                          v: "domestic" | "imported" | "unknown",
                        ) => updateMaterial(material.id, { source: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_SOURCES.map((src) => (
                            <SelectItem key={src.value} value={src.value}>
                              {t(src.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {extMaterial.confidenceScore !== undefined &&
                      extMaterial.confidenceScore < 1.0 && (
                        <div className="space-y-2">
                          <Label>{t("dataConfidence")}</Label>
                          <div className="flex items-center gap-2 h-10">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  extMaterial.confidenceScore >= 0.7
                                    ? "bg-green-500"
                                    : extMaterial.confidenceScore >= 0.4
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${extMaterial.confidenceScore * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(
                                (extMaterial.confidenceScore || 0) * 100,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <Label className="text-sm">{t("certifications")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICATIONS.map((cert) => (
                        <Badge
                          key={cert.value}
                          variant={
                            (material.certifications || []).includes(cert.value)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            toggleCertification(material.id, cert.value)
                          }
                        >
                          {cert.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              onClick={addMaterial}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addMaterial")}
            </Button>
          </CardContent>
        </Card>

        {/* Accessories Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("accessories")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.accessories.map((accessory, index) => (
              <div key={accessory.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("accessoryIndex", { index: index + 1 })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccessory(accessory.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("accessoryType")}</Label>
                    <Select
                      value={accessory.type}
                      onValueChange={(v) =>
                        updateAccessory(accessory.id, { type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("accessoryTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESSORY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("accessoryName")}</Label>
                    <Input
                      value={accessory.name}
                      onChange={(e) =>
                        updateAccessory(accessory.id, { name: e.target.value })
                      }
                      placeholder={t("accessoryNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("accessoryWeight")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={accessory.weight || ""}
                      onChange={(e) =>
                        updateAccessory(accessory.id, {
                          weight: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addAccessory}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addAccessory")}
            </Button>
          </CardContent>
        </Card>

        {/* Proxy Warning */}
        {hasProxySource && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700">
                  {t("proxyWarningTitle")}
                </p>
                <p className="text-yellow-600 mt-1">
                  {t("proxyWarningText")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Other Material Modal */}
        <OtherMaterialModal
          open={otherModalOpen}
          onOpenChange={setOtherModalOpen}
          onSelectMaterial={handleOtherMaterialSelect}
        />
      </div>
    </TooltipProvider>
  );
};

export default Step2Materials;
