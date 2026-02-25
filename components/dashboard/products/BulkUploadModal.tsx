import React, { useState, useCallback, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck,
  FileSpreadsheet,
  Leaf,
  Loader2,
  Package,
  Upload
} from "lucide-react";
import {
  BULK_UPLOAD_STEPS,
  type BulkUploadStep,
  type BulkProductRow,
  type ValidationError,
  type ValidationResult
} from "./types";
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
  type BulkImportResult
} from "@/lib/productsApi";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const STEP_LABEL_KEYS: Record<BulkUploadStep["id"], string> = {
  upload: "steps.upload.label",
  validate: "steps.validate.label",
  preview: "steps.preview.label",
  processing: "steps.processing.label",
  complete: "steps.complete.label"
};

const DESTINATION_MARKET_BY_EXPORT_COUNTRY: Record<string, string> = {
  eu: "eu",
  us: "usa",
  jp: "japan",
  kr: "korea",
  other: "other"
};

const DISTANCE_BY_DESTINATION_MARKET: Record<string, number> = {
  vietnam: 500,
  eu: 10000,
  usa: 14000,
  japan: 3500,
  korea: 3200,
  other: 5000
};

const resolveDestinationMarket = (row: BulkProductRow): string => {
  if (row.marketType === "domestic") return "vietnam";
  if (!row.exportCountry) return "other";
  return DESTINATION_MARKET_BY_EXPORT_COUNTRY[row.exportCountry] || "other";
};

const resolveEstimatedDistance = (destinationMarket: string): number =>
DISTANCE_BY_DESTINATION_MARKET[destinationMarket] || 5000;

const resolveTransportLegMode = (
mode: BulkProductRow["transportMode"])
: "road" | "sea" | "air" | "rail" =>
mode === "multimodal" ? "sea" : mode;

const buildAccessories = (rawAccessories?: string) => {
  if (!rawAccessories?.trim()) return [];

  return rawAccessories.
  split(/[,;|]/).
  map((item) => item.trim()).
  filter((item) => item.length > 0).
  map((item, index) => ({
    id: `accessory-${index + 1}`,
    name: item,
    type: "other"
  }));
};

const buildMaterials = (row: BulkProductRow) => {
  const materials = [
  {
    id: "material-1",
    materialType: row.primaryMaterial,
    percentage: row.primaryMaterialPercentage,
    source: row.materialSource,
    certifications: [] as string[]
  }];

  if (
  row.secondaryMaterial &&
  typeof row.secondaryMaterialPercentage === "number" &&
  row.secondaryMaterialPercentage > 0)
  {
    materials.push({
      id: "material-2",
      materialType: row.secondaryMaterial,
      percentage: row.secondaryMaterialPercentage,
      source: row.materialSource,
      certifications: []
    });
  }

  return materials;
};

const mapBulkRowToApiPayload = (row: BulkProductRow): Record<string, unknown> => {
  const destinationMarket = resolveDestinationMarket(row);
  const estimatedTotalDistance = resolveEstimatedDistance(destinationMarket);
  const transportMode = resolveTransportLegMode(row.transportMode);
  const materials = buildMaterials(row);
  const accessories = buildAccessories(row.accessories);
  const productionProcesses = row.processes || [];
  const energySources = [
  {
    id: "energy-1",
    source: row.energySource,
    percentage: 100
  }];
  const transportLegs = [
  {
    id: "leg-1",
    mode: transportMode,
    estimatedDistance: estimatedTotalDistance
  }];

  const payload: Record<string, unknown> = {
    sku: row.sku,
    productCode: row.sku,
    product_code: row.sku,
    productName: row.productName,
    product_name: row.productName,
    productType: row.productType,
    product_type: row.productType,
    quantity: row.quantity,
    weightPerUnit: row.weightPerUnit,
    weight_per_unit: row.weightPerUnit,
    primaryMaterial: row.primaryMaterial,
    primaryMaterialPercentage: row.primaryMaterialPercentage,
    secondaryMaterial: row.secondaryMaterial,
    secondaryMaterialPercentage: row.secondaryMaterialPercentage,
    accessories,
    accessoriesText: row.accessories,
    materialSource: row.materialSource,
    materials,
    processes: productionProcesses,
    productionProcesses,
    production_processes: productionProcesses,
    energySource: row.energySource,
    energySources,
    energy_sources: energySources,
    marketType: row.marketType,
    market_type: row.marketType,
    destinationMarket,
    destination_market: destinationMarket,
    exportCountry: row.exportCountry,
    export_country: row.exportCountry,
    transportMode: row.transportMode,
    transport_mode: row.transportMode,
    transportLegs,
    transport_legs: transportLegs,
    estimatedTotalDistance,
    estimated_total_distance: estimatedTotalDistance
  };

  if (typeof row.calculatedCO2 === "number") {
    payload.calculatedCO2 = row.calculatedCO2;
  }
  if (row.scope) {
    payload.scope = row.scope;
  }
  if (row.confidenceLevel) {
    payload.confidenceLevel = row.confidenceLevel;
  }

  return payload;
};

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
existingSkus: Set<string>,
duplicateMessage: (sku: string) => string)
: ValidationError[] =>
rows.
filter((row) => row.sku && existingSkus.has(normalizeSku(row.sku))).
map((row) => ({
  row: row.sourceRow || 1,
  field: "sku",
  message: duplicateMessage(row.sku),
  severity: "warning" as const
}));

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  open,
  onClose,
  onCompleted
}) => {
  const t = useTranslations("products.bulkUpload");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";
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
        setError(t("errors.invalidFileType"));
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsProcessing(true);

      try {
        const rawData = await parseFile(selectedFile);

        if (rawData.length === 0) {
          setError(t("errors.emptyFile"));
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
              existingSkus,
              (sku) => t("warnings.skuExists", { sku })
            );
            if (duplicateSkuWarnings.length > 0) {
              result = mergeValidationWarnings(result, duplicateSkuWarnings);
              toast.warning(
                t("warnings.duplicateSkuDetected", { count: duplicateSkuWarnings.length })
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
                t("warnings.backendValidationSummary", {
                  errors: backendValidation.errorCount,
                  warnings: backendValidation.warningCount
                })
              );
            }
          } catch (validationError) {
            const message = formatApiErrorMessage(
              validationError,
              t("errors.validateApiFallback")
            );
            toast.warning(message);
          }
        }

        setValidationResult(result);
        setCurrentStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.readFile"));
      } finally {
        setIsProcessing(false);
      }
    },
    [t]
  );

  const handleDownloadTemplate = useCallback(async (format: "xlsx" | "csv") => {
    try {
      await downloadProductsBulkTemplate(format);
    } catch (downloadError) {

      generateTemplate(format);
      toast.warning(
        formatApiErrorMessage(
          downloadError,
          t("errors.templateApiFallback")
        )
      );
    }
  }, [t]);

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
          const message = formatApiErrorMessage(uploadError, t("errors.uploadFileFailed"));
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

          toast.warning(t("warnings.fileImportFallback"));
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
        toast.warning(t("warnings.partialImport", { imported: result.imported, failed: result.failed }));
      } else {
        toast.success(t("success.importSuccess", { imported: result.imported }));
      }

      onCompleted?.();
    } catch (importError) {
      setCurrentStep(2);
      setError(formatApiErrorMessage(importError, t("errors.importFailed")));
      toast.error(formatApiErrorMessage(importError, t("errors.importFailed")));
    } finally {
      setIsProcessing(false);
    }
  }, [file, processedRows, onCompleted, t]);

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
                  <h4 className="font-medium mb-1">{t("template.title")}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("template.description")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void handleDownloadTemplate("xlsx");
                      }}>

                      <Download className="w-4 h-4 mr-1" /> {t("template.downloadExcel")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void handleDownloadTemplate("csv");
                      }}>

                      <Download className="w-4 h-4 mr-1" /> {t("template.downloadCsv")}
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
                  <p className="text-muted-foreground">{t("upload.processingFile")}</p>
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

                    {t("upload.selectAnotherFile")}
                  </Button>
                </div> :

              <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t("upload.dropzoneTitle")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("upload.dropzoneDescription")}
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
                      <ArrowLeft className="w-4 h-4 mr-1" /> {t("actions.uploadAnother")}
                    </Button>
                    <Button
                  onClick={handleProceedToPreview}
                  disabled={isProcessing}>

                      {isProcessing ?
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> :

                  <ArrowRight className="w-4 h-4 mr-1" />
                  }
                      {t("actions.continueWithCount", { count: validationResult.validCount })}
                    </Button>
                  </div>
              }

                {validationResult.validCount === 0 &&
              <div className="flex justify-center pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> {t("actions.uploadAnother")}
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
                    <p className="text-xs text-muted-foreground">{t("stats.products")}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {processedRows.
                    reduce((sum, r) => sum + r.quantity, 0).
                    toLocaleString(displayLocale)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("stats.totalQuantity")}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Leaf className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {processedRows.
                    reduce((sum, r) => sum + (r.calculatedCO2 || 0), 0).
                    toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("stats.co2ePerUnit")}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">
                      {
                    processedRows.filter(
                      (r) => r.confidenceLevel === "high"
                    ).length
                    }
                    </p>
                    <p className="text-xs text-muted-foreground">{t("stats.highConfidence")}</p>
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
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t("actions.back")}
                  </Button>
                  <Button onClick={() => void handleImportProducts()}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> {t("actions.importCount", { count: processedRows.length })}
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
                <h3 className="font-medium text-lg">{t("processing.title")}</h3>
                <p className="text-muted-foreground">{t("processing.description")}</p>
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
                <h3 className="font-medium text-lg">{t("completed.title")}</h3>
                <p className="text-muted-foreground">
                  {t("completed.description", { count: importedCount })}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("completed.importedProducts")}</span>
                <Badge variant="default" className="bg-green-600">
                  {importResult?.imported ?? importedCount}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("completed.failedRows")}</span>
                <Badge variant="secondary">{importResult?.failed ?? 0}</Badge>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                {t("actions.close")}
              </Button>
              <Button onClick={handleViewProducts}>
                <Package className="w-4 h-4 mr-1" /> {t("actions.viewProducts")}
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
            {t("modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("modal.description")}
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

                  {t(STEP_LABEL_KEYS[step.id])}
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

