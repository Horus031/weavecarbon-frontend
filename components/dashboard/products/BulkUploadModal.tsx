import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Package } from
"lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BulkProductRow,
  ValidationError,
  ValidationResult,
  BULK_UPLOAD_STEPS } from
"./types";
import { generateTemplate } from "./template";
import { parseFile, validateAndTransformData } from "./validation";
import { calculateBulkCarbon } from "./carbonCalculation";
import ValidationResults from "./ValidationResults";
import PreviewTable from "./PreviewTable";
import {
  downloadProductsBulkTemplate,
  fetchAllProducts,
  formatApiErrorMessage,
  getApiErrorCode,
  importProductsBulkFile,
  importProductsBulkRows,
  validateProductsBulkImport,
  type BulkImportResult } from
"@/lib/productsApi";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const mapBulkRowToApiPayload = (row: BulkProductRow): Record<string, unknown> => ({
  sku: row.sku,
  productName: row.productName,
  productType: row.productType,
  quantity: row.quantity,
  weightPerUnit: row.weightPerUnit,
  primaryMaterial: row.primaryMaterial,
  primaryMaterialPercentage: row.primaryMaterialPercentage,
  secondaryMaterial: row.secondaryMaterial,
  secondaryMaterialPercentage: row.secondaryMaterialPercentage,
  accessories: row.accessories,
  materialSource: row.materialSource,
  processes: row.processes,
  energySource: row.energySource,
  marketType: row.marketType,
  exportCountry: row.exportCountry,
  transportMode: row.transportMode,
  calculatedCO2: row.calculatedCO2,
  scope: row.scope,
  confidenceLevel: row.confidenceLevel
});

const normalizeSku = (value: string) => value.trim().toUpperCase();

const dedupeWarnings = (warnings: ValidationError[]): ValidationError[] => {
  const unique = new Map<string, ValidationError>();

  warnings.forEach((warning) => {
    const key = `${warning.row}|${warning.field}|${warning.message}`;
    if (!unique.has(key)) {
      unique.set(key, warning);
    }
  });

  return Array.from(unique.values()).sort((a, b) => a.row - b.row);
};

const mergeValidationWarnings = (
base: ValidationResult,
extraWarnings: ValidationError[])
: ValidationResult => {
  const mergedWarnings = dedupeWarnings([...base.warnings, ...extraWarnings]);
  return {
    ...base,
    warnings: mergedWarnings,
    warningCount: mergedWarnings.length
  };
};

const buildExistingSkuWarnings = (
rows: BulkProductRow[],
existingSkus: Set<string>)
: ValidationError[] =>
rows.
filter((row) => row.sku && existingSkus.has(normalizeSku(row.sku))).
map((row) => ({
  row: row.sourceRow || 1,
  field: "sku",
  message: `SKU "${row.sku}" da ton tai trong he thong`,
  severity: "warning" as const
}));

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  open,
  onClose,
  onCompleted
}) => {
  const navigate = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
  useState<ValidationResult | null>(null);
  const [processedRows, setProcessedRows] = useState<BulkProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setCurrentStep(0);
    setFile(null);
    setValidationResult(null);
    setProcessedRows([]);
    setIsProcessing(false);
    setImportProgress(0);
    setImportedCount(0);
    setImportResult(null);
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

      const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"];


      if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(xlsx|xls|csv)$/i))
      {
        setError("Vui lòng chọn file Excel (.xlsx) hoặc CSV");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsProcessing(true);

      try {
        const rawData = await parseFile(selectedFile);

        if (rawData.length === 0) {
          setError("File không có dữ liệu. Vui lòng kiểm tra lại.");
          setIsProcessing(false);
          return;
        }

        let result = validateAndTransformData(rawData);

        if (result.validRows.length > 0) {
          try {
            const existingProducts = await fetchAllProducts();
            const existingSkus = new Set(
              existingProducts.
              map((product) => normalizeSku(product.productCode || "")).
              filter((sku) => sku.length > 0)
            );

            const duplicateSkuWarnings = buildExistingSkuWarnings(
              result.validRows,
              existingSkus
            );
            if (duplicateSkuWarnings.length > 0) {
              result = mergeValidationWarnings(result, duplicateSkuWarnings);
              toast.warning(
                `Phat hien ${duplicateSkuWarnings.length} dong co SKU trung voi he thong`
              );
            }
          } catch {

          }

          try {
            const backendValidation = await validateProductsBulkImport(
              result.validRows.map(mapBulkRowToApiPayload)
            );

            if (backendValidation.warnings.length > 0) {
              const backendWarnings: ValidationError[] =
              backendValidation.warnings.map((warning) => ({
                row: warning.row || 1,
                field: warning.field || "general",
                message: warning.message,
                severity: "warning"
              }));
              result = mergeValidationWarnings(result, backendWarnings);
            }

            if (
            backendValidation.errorCount > 0 ||
            backendValidation.warningCount > 0)
            {
              toast.warning(
                `Backend validation: ${backendValidation.errorCount} lỗi, ${backendValidation.warningCount} cảnh báo`
              );
            }
          } catch (validationError) {
            const message = formatApiErrorMessage(
              validationError,
              "Không thể gọi API validate, đang dùng kiểm tra local."
            );
            toast.warning(message);
          }
        }

        setValidationResult(result);
        setCurrentStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi đọc file");
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleDownloadTemplate = useCallback(async (format: "xlsx" | "csv") => {
    try {
      await downloadProductsBulkTemplate(format);
    } catch (downloadError) {

      generateTemplate(format);
      toast.warning(
        formatApiErrorMessage(
          downloadError,
          "Đã dùng template local vì API template chưa sẵn sàng"
        )
      );
    }
  }, []);

  const handleProceedToPreview = useCallback(() => {
    if (!validationResult) return;

    setIsProcessing(true);
    const calculatedRows = calculateBulkCarbon(validationResult.validRows);
    setProcessedRows(calculatedRows);
    setCurrentStep(2);
    setIsProcessing(false);
  }, [validationResult]);

  const handleImportProducts = useCallback(async () => {
    if (processedRows.length === 0) return;

    setCurrentStep(3);
    setIsProcessing(true);
    setImportProgress(20);
    setError(null);

    try {
      let result: BulkImportResult | null = null;

      if (file) {
        try {
          setImportProgress(45);
          result = await importProductsBulkFile(file, "draft");
        } catch (uploadError) {
          const errorCode = getApiErrorCode(uploadError);
          const message = formatApiErrorMessage(uploadError, "Upload file thất bại");
          const normalized = message.toLowerCase();
          const canFallbackToRows =
          errorCode === "NOT_IMPLEMENTED" ||
          errorCode === "NOT_FOUND" ||
          normalized.includes("not implemented") ||
          normalized.includes("not found") ||
          normalized.includes("route") ||
          normalized.includes("unsupported");

          if (!canFallbackToRows) {
            throw uploadError;
          }

          toast.warning(
            "API import file chưa sẵn sàng, chuyển sang import theo dữ liệu đã parse."
          );
        }
      }

      if (!result) {
        const payloadRows = processedRows.map(mapBulkRowToApiPayload);
        setImportProgress(60);
        result = await importProductsBulkRows(payloadRows, "draft");
      }

      setImportProgress(100);
      setImportedCount(result.imported);
      setImportResult(result);
      setCurrentStep(4);

      if (result.failed > 0) {
        toast.warning(`Đã import ${result.imported} sản phẩm, ${result.failed} dòng lỗi`);
      } else {
        toast.success(`Đã import thành công ${result.imported} sản phẩm`);
      }

      onCompleted?.();
    } catch (importError) {
      setCurrentStep(2);
      setError(formatApiErrorMessage(importError, "Import thất bại"));
      toast.error(formatApiErrorMessage(importError, "Import thất bại"));
    } finally {
      setIsProcessing(false);
    }
  }, [file, processedRows, onCompleted]);

  const handleViewProducts = useCallback(() => {
    handleClose();
    navigate.push("/products");
  }, [handleClose, navigate]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
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
                      onClick={() => {
                        void handleDownloadTemplate("xlsx");
                      }}>

                      <Download className="w-4 h-4 mr-1" /> Excel (.xlsx)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void handleDownloadTemplate("csv");
                      }}>

                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${file ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
              onClick={() => fileInputRef.current?.click()}>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect} />


              {isProcessing ?
              <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Đang đọc file...</p>
                </div> :
              file ?
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
                  }}>

                    Chọn file khác
                  </Button>
                </div> :

              <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Kéo thả file vào đây</p>
                    <p className="text-sm text-muted-foreground">
                      hoặc click để chọn file Excel (.xlsx) / CSV
                    </p>
                  </div>
                </div>
              }
            </div>

            {error &&
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            }
          </div>);


      case 1:
        return (
          <div className="space-y-4">
            {validationResult &&
            <>
                <ValidationResults result={validationResult} />

                {validationResult.validCount > 0 &&
              <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Tải file khác
                    </Button>
                    <Button
                  onClick={handleProceedToPreview}
                  disabled={isProcessing}>

                      {isProcessing ?
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> :

                  <ArrowRight className="w-4 h-4 mr-1" />
                  }
                      Tiếp tục ({validationResult.validCount} sản phẩm)
                    </Button>
                  </div>
              }

                {validationResult.validCount === 0 &&
              <div className="flex justify-center pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Tải file khác
                    </Button>
                  </div>
              }
              </>
            }
          </div>);


      case 2:
        return (
          <div className="space-y-4">
            {processedRows.length > 0 &&
            <>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Package className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">{processedRows.length}</p>
                    <p className="text-xs text-muted-foreground">Sản phẩm</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {processedRows.
                    reduce((sum, r) => sum + r.quantity, 0).
                    toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Tổng số lượng</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Leaf className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {processedRows.
                    reduce((sum, r) => sum + (r.calculatedCO2 || 0), 0).
                    toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">CO2e (kg/unit)</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {
                    processedRows.filter(
                      (r) => r.confidenceLevel === "high"
                    ).length
                    }
                    </p>
                    <p className="text-xs text-muted-foreground">Độ tin cậy cao</p>
                  </div>
                </div>

                <PreviewTable rows={processedRows} showCarbonData />

                {error &&
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
              }

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                  </Button>
                  <Button onClick={() => void handleImportProducts()}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Nhập {processedRows.length} sản phẩm
                  </Button>
                </div>
              </>
            }
          </div>);


      case 3:
        return (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-medium text-lg">Đang nhập sản phẩm...</h3>
                <p className="text-muted-foreground">Đang xử lý file</p>
              </div>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>);


      case 4:
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
                <span className="text-muted-foreground">Sản phẩm đã nhập:</span>
                <Badge variant="default" className="bg-green-600">
                  {importResult?.imported ?? importedCount}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dòng lỗi:</span>
                <Badge variant="secondary">{importResult?.failed ?? 0}</Badge>
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
          </div>);


      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="w-[96vw] max-w-[1400px] max-h-[92vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Tải file sản phẩm hàng loạt
          </DialogTitle>
          <DialogDescription>
            Import danh sách sản phẩm từ file Excel hoặc CSV, hệ thống sẽ tự động tính toán carbon
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {BULK_UPLOAD_STEPS.map((step, index) =>
          <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                index < currentStep ?
                "bg-primary text-primary-foreground" :
                index === currentStep ?
                "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" :
                "bg-muted text-muted-foreground"}`
                }>

                  {index < currentStep ?
                <CheckCircle2 className="w-4 h-4" /> :

                index + 1
                }
                </div>
                <span
                className={`text-xs mt-1 ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>

                  {step.label}
                </span>
              </div>
              {index < BULK_UPLOAD_STEPS.length - 1 &&
            <div
              className={`flex-1 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />

            }
            </React.Fragment>
          )}
        </div>

        {renderStep()}
      </DialogContent>
    </Dialog>);

};

export default BulkUploadModal;