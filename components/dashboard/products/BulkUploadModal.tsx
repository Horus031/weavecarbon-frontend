import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProducts, DashboardProduct } from "@/contexts/ProductContext";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Leaf,
  Package,
} from "lucide-react";
import { BulkProductRow, ValidationResult, BULK_UPLOAD_STEPS } from "./types";
import { generateTemplate } from "./template";
import { parseFile, validateAndTransformData } from "./validation";
import { calculateBulkCarbon } from "./carbonCalculation";
import ValidationResults from "./ValidationResults";
import PreviewTable from "./PreviewTable";
import { useRouter } from "next/navigation";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  tshirt: "apparel",
  pants: "apparel",
  dress: "apparel",
  jacket: "apparel",
  shoes: "footwear",
  bag: "accessories",
  accessories: "accessories",
  other: "textiles",
};

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ open, onClose }) => {
  const navigate = useRouter();
  const { addProduct } = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [processedRows, setProcessedRows] = useState<BulkProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setCurrentStep(0);
    setFile(null);
    setValidationResult(null);
    setProcessedRows([]);
    setIsProcessing(false);
    setImportProgress(0);
    setImportedCount(0);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)
      ) {
        setError("Vui lòng chọn file Excel (.xlsx) hoặc CSV");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsProcessing(true);

      try {
        // Parse file
        const rawData = await parseFile(selectedFile);

        if (rawData.length === 0) {
          setError("File không có dữ liệu. Vui lòng kiểm tra lại.");
          setIsProcessing(false);
          return;
        }

        // Validate data
        const result = validateAndTransformData(rawData);
        setValidationResult(result);
        setCurrentStep(1); // Move to validation step
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi đọc file");
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const handleDownloadTemplate = useCallback((format: "xlsx" | "csv") => {
    generateTemplate(format);
  }, []);

  const handleProceedToPreview = useCallback(() => {
    if (!validationResult) return;

    setIsProcessing(true);

    // Calculate carbon for valid rows
    const calculatedRows = calculateBulkCarbon(validationResult.validRows);
    setProcessedRows(calculatedRows);
    setCurrentStep(2); // Move to preview step
    setIsProcessing(false);
  }, [validationResult]);

  const handleImportProducts = useCallback(async () => {
    if (processedRows.length === 0) return;

    setCurrentStep(3); // Move to processing step
    setIsProcessing(true);
    setImportProgress(0);

    const totalRows = processedRows.length;
    let imported = 0;

    for (const row of processedRows) {
      // Create product from bulk row
      const newProduct: Omit<DashboardProduct, "id" | "createdAt"> = {
        name: row.productName,
        sku: row.sku,
        category: CATEGORY_MAP[row.productType] || "apparel",
        co2: row.calculatedCO2 || 0,
        status: row.confidenceLevel === "high" ? "published" : "draft",
        materials: [row.primaryMaterial, row.secondaryMaterial].filter(
          Boolean,
        ) as string[],
        weight: row.weightPerUnit / 1000, // Convert to kg
        unit: "kg",
        scope: row.scope || "scope1",
        confidenceScore:
          row.confidenceLevel === "high"
            ? 90
            : row.confidenceLevel === "medium"
              ? 70
              : 50,
        isDemo: false,
      };

      addProduct(newProduct);
      imported++;
      setImportedCount(imported);
      setImportProgress((imported / totalRows) * 100);

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setCurrentStep(4); // Move to complete step
    setIsProcessing(false);
  }, [processedRows, addProduct]);

  const handleViewProducts = useCallback(() => {
    handleClose();
    navigate.push("/dashboard/products");
  }, [handleClose, navigate]);

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Upload
        return (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Tải file mẫu</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tải file mẫu với cấu trúc chuẩn và hướng dẫn chi tiết
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("xlsx")}
                    >
                      <Download className="w-4 h-4 mr-1" /> Excel (.xlsx)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("csv")}
                    >
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${file ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Đang đọc file...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileCheck className="w-10 h-10 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                  >
                    Chọn file khác
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Kéo thả file vào đây</p>
                    <p className="text-sm text-muted-foreground">
                      hoặc click để chọn file Excel (.xlsx) / CSV
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        );

      case 1: // Validate
        return (
          <div className="space-y-4">
            {validationResult && (
              <>
                <ValidationResults result={validationResult} />

                {validationResult.validCount > 0 && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Tải file khác
                    </Button>
                    <Button
                      onClick={handleProceedToPreview}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-1" />
                      )}
                      Tiếp tục ({validationResult.validCount} sản phẩm)
                    </Button>
                  </div>
                )}

                {validationResult.validCount === 0 && (
                  <div className="flex justify-center pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Tải file khác
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 2: // Preview
        return (
          <div className="space-y-4">
            {/* Stats Summary */}
            {processedRows.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Package className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">{processedRows.length}</p>
                    <p className="text-xs text-muted-foreground">Sản phẩm</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {processedRows
                        .reduce((sum, r) => sum + r.quantity, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tổng số lượng
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Leaf className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {processedRows
                        .reduce((sum, r) => sum + (r.calculatedCO2 || 0), 0)
                        .toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CO₂e (kg/unit)
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {
                        processedRows.filter(
                          (r) => r.confidenceLevel === "high",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Độ tin cậy cao
                    </p>
                  </div>
                </div>

                <PreviewTable rows={processedRows} showCarbonData />

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                  </Button>
                  <Button onClick={handleImportProducts}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Nhập{" "}
                    {processedRows.length} sản phẩm
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 3: // Processing
        return (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-medium text-lg">Đang nhập sản phẩm...</h3>
                <p className="text-muted-foreground">
                  {importedCount} / {processedRows.length} sản phẩm
                </p>
              </div>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        );

      case 4: // Complete
        return (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg">Hoàn tất!</h3>
                <p className="text-muted-foreground">
                  Đã nhập thành công {importedCount} sản phẩm vào hệ thống
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Sản phẩm Published:
                </span>
                <Badge variant="default" className="bg-green-600">
                  {
                    processedRows.filter((r) => r.confidenceLevel === "high")
                      .length
                  }
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Sản phẩm Draft (cần bổ sung):
                </span>
                <Badge variant="secondary">
                  {
                    processedRows.filter((r) => r.confidenceLevel !== "high")
                      .length
                  }
                </Badge>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
              <Button onClick={handleViewProducts}>
                <Package className="w-4 h-4 mr-1" /> Xem danh sách sản phẩm
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Tải file sản phẩm hàng loạt
          </DialogTitle>
          <DialogDescription>
            Import danh sách sản phẩm từ file Excel hoặc CSV, hệ thống sẽ tự
            động tính toán carbon
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {BULK_UPLOAD_STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {index < BULK_UPLOAD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
