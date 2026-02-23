import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  CatalogMaterial,
  MaterialType,
  MATERIAL_TYPE_LABELS,
} from "./materialCatalog";

interface AICandidate {
  material: CatalogMaterial;
  score: number;
  rationale?: string;
}

interface OtherMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMaterial: (
    material: CatalogMaterial | null,
    customData?: {
      name: string;
      description: string;
      materialType: MaterialType;
      confidenceScore: number;
      isProxy: boolean;
    },
  ) => void;
}

const OtherMaterialModal: React.FC<OtherMaterialModalProps> = ({
  open,
  onOpenChange,
  onSelectMaterial,
}) => {
  const t = useTranslations("assessment.otherMaterial");
  const [step, setStep] = useState<"input" | "results">("input");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Input fields
  const [materialName, setMaterialName] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("fabric");
  const [application, setApplication] = useState("body_fabric");

  // Results
  const [candidates, setCandidates] = useState<AICandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [useProxy, setUseProxy] = useState(false);

  const resetForm = () => {
    setStep("input");
    setMaterialName("");
    setMaterialDescription("");
    setMaterialType("fabric");
    setApplication("body_fabric");
    setCandidates([]);
    setSelectedCandidateId(null);
    setUseProxy(false);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  //   const handleAnalyze = async () => {
  //     if (!materialName.trim()) {
  //       toast.error("Vui lòng nhập tên vật liệu");
  //       return;
  //     }

  //     setIsAnalyzing(true);

  //     try {
  //       const { data, error } = await supabase.functions.invoke(
  //         "analyze-material",
  //         {
  //           body: {
  //             name: materialName,
  //             description: materialDescription,
  //             materialType,
  //             application,
  //           },
  //         },
  //       );

  //       if (error) throw error;

  //       if (data?.candidates && data.candidates.length > 0) {
  //         setCandidates(data.candidates);
  //         setStep("results");
  //       } else {
  //         // No good matches found, suggest proxy
  //         setCandidates([]);
  //         setUseProxy(true);
  //         setStep("results");
  //       }
  //     } catch (error) {
  //       console.error("Error analyzing material:", error);
  //       // Fallback: show proxy option
  //       setCandidates([]);
  //       setUseProxy(true);
  //       setStep("results");
  //       toast.error("Không thể phân tích vật liệu. Đang dùng chế độ proxy.");
  //     } finally {
  //       setIsAnalyzing(false);
  //     }
  //   };

  const handleConfirmSelection = () => {
    if (selectedCandidateId) {
      // User selected a catalog material
      const selected = candidates.find(
        (c) => c.material.id === selectedCandidateId,
      );
      if (selected) {
        onSelectMaterial(selected.material);
        handleClose();
        return;
      }
    }

    // User chose proxy/other
    // const proxyFactor = getProxyEmissionFactor(undefined, application);
    // onSelectMaterial(null, {
    //   name: materialName,
    //   description: materialDescription,
    //   materialType,
    //   confidenceScore: 0.3, // Low confidence for proxy
    //   isProxy: true,
    // });
    handleClose();
  };

  const getScoreBadgeVariant = (
    score: number,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 0.75) return "default";
    if (score >= 0.45) return "secondary";
    return "outline";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.75) return t("scoreVeryGood");
    if (score >= 0.45) return t("scoreGood");
    return t("scoreLow");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? t("descriptionInput")
              : t("descriptionResults")}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">{t("materialName")}</Label>
              <Input
                id="material-name"
                placeholder={t("materialNamePlaceholder")}
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-description">{t("descriptionLabel")}</Label>
              <Textarea
                id="material-description"
                placeholder={t("descriptionPlaceholder")}
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("materialType")}</Label>
                <Select
                  value={materialType}
                  onValueChange={(v) => setMaterialType(v as MaterialType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATERIAL_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("application")}</Label>
                <Select value={application} onValueChange={setApplication}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="body_fabric">
                      {t("appBodyFabric")}
                    </SelectItem>
                    <SelectItem value="lining">{t("appLining")}</SelectItem>
                    <SelectItem value="zipper">{t("appZipper")}</SelectItem>
                    <SelectItem value="button">{t("appButton")}</SelectItem>
                    <SelectItem value="thread">{t("appThread")}</SelectItem>
                    <SelectItem value="label">{t("appLabel")}</SelectItem>
                    <SelectItem value="elastic">{t("appElastic")}</SelectItem>
                    <SelectItem value="padding">{t("appPadding")}</SelectItem>
                    <SelectItem value="trim">{t("appTrim")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {candidates.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("systemSuggests", { count: candidates.length })}
                </p>

                <RadioGroup
                  value={selectedCandidateId || ""}
                  onValueChange={setSelectedCandidateId}
                >
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.material.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCandidateId === candidate.material.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        setSelectedCandidateId(candidate.material.id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value={candidate.material.id}
                            id={candidate.material.id}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Label
                                htmlFor={candidate.material.id}
                                className="font-medium cursor-pointer"
                              >
                                {candidate.material.displayNameVi}
                              </Label>
                              <Badge
                                variant={getScoreBadgeVariant(candidate.score)}
                              >
                                {Math.round(candidate.score * 100)}% -{" "}
                                {getScoreLabel(candidate.score)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {candidate.material.displayNameEn} • CO₂:{" "}
                              {candidate.material.co2Factor} kg/kg
                            </p>
                            {candidate.rationale && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {candidate.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>

                <div className="border-t pt-4">
                  <Card
                    className={`cursor-pointer transition-colors ${
                      useProxy ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedCandidateId(null);
                      setUseProxy(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value="proxy"
                          checked={useProxy && !selectedCandidateId}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="font-medium cursor-pointer">
                              {t("notInList")}
                            </Label>
                            <Badge variant="outline">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Proxy
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("proxyEstimate")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-medium mb-2">
                  {t("noMatch")}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("noMatchDesc", { name: materialName })}
                </p>
                <Card className="text-left">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{t("useProxyTitle")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("useProxyDesc")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "input" ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button
                // onClick={handleAnalyze}
                disabled={isAnalyzing || !materialName.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("analyzing")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("analyzeMaterial")}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>
                {t("goBack")}
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={
                  !selectedCandidateId && !useProxy && candidates.length > 0
                }
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t("confirm")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtherMaterialModal;
