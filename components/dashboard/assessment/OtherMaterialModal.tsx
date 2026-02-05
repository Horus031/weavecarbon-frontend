import React, { useState } from "react";
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
    if (score >= 0.75) return "Rất phù hợp";
    if (score >= 0.45) return "Có thể phù hợp";
    return "Độ tin cậy thấp";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Thêm vật liệu khác
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Mô tả vật liệu để hệ thống AI gợi ý phân loại phù hợp"
              : "Chọn vật liệu gợi ý hoặc tạo yêu cầu mới"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Tên vật liệu *</Label>
              <Input
                id="material-name"
                placeholder="VD: Vải lông cừu nhân tạo, Zipper tape canvas..."
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-description">Mô tả (khuyến nghị)</Label>
              <Textarea
                id="material-description"
                placeholder="Mô tả thêm về đặc tính, nguồn gốc, hoặc cách sử dụng vật liệu..."
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại vật liệu</Label>
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
                <Label>Mục đích sử dụng</Label>
                <Select value={application} onValueChange={setApplication}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="body_fabric">
                      Vải chính (body)
                    </SelectItem>
                    <SelectItem value="lining">Vải lót</SelectItem>
                    <SelectItem value="zipper">Khóa kéo</SelectItem>
                    <SelectItem value="button">Nút</SelectItem>
                    <SelectItem value="thread">Chỉ may</SelectItem>
                    <SelectItem value="label">Nhãn mác</SelectItem>
                    <SelectItem value="elastic">Thun co giãn</SelectItem>
                    <SelectItem value="padding">Đệm/Mút</SelectItem>
                    <SelectItem value="trim">Phụ liệu khác</SelectItem>
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
                  Hệ thống gợi ý {candidates.length} vật liệu phù hợp:
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
                              Không có trong danh sách - Tạo yêu cầu mới
                            </Label>
                            <Badge variant="outline">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Proxy
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Hệ thống sẽ dùng hệ số ước tính. Yêu cầu sẽ được xem
                            xét để bổ sung vào danh mục.
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
                  Không tìm thấy vật liệu phù hợp
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Hệ thống không tìm được vật liệu &quot;{materialName}&quot;
                  trong danh mục. Bạn có thể tạo yêu cầu để bổ sung vào danh
                  mục.
                </p>
                <Card className="text-left">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Sử dụng hệ số proxy</p>
                        <p className="text-sm text-muted-foreground">
                          Vật liệu sẽ được tính với hệ số ước tính trung bình
                          ngành. Kết quả carbon sẽ có độ tin cậy thấp hơn.
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
                Hủy
              </Button>
              <Button
                // onClick={handleAnalyze}
                disabled={isAnalyzing || !materialName.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Phân tích vật liệu
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>
                Quay lại
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={
                  !selectedCandidateId && !useProxy && candidates.length > 0
                }
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Xác nhận
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtherMaterialModal;
