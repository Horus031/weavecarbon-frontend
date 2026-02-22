"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
"@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Package,
  Leaf,
  Factory,
  Truck,
  Save } from
"lucide-react";
import StepIndicators from "./StepIndicators";
import StepContent from "./StepContent";
import { DraftVersion, ProductAssessmentData } from "./steps/types";
import {
  createProduct,
  formatApiErrorMessage,
  isValidProductId,
  updateProduct } from
"@/lib/productsApi";

const steps = [
{ id: 1, title: "Product Info", icon: Package, key: "productInfo" },
{ id: 2, title: "Materials", icon: Leaf, key: "materials" },
{ id: 3, title: "Manufacturing", icon: Factory, key: "manufacturing" },
{ id: 4, title: "Logistics", icon: Truck, key: "logistics" },
{ id: 5, title: "Assessment", icon: CheckCircle2, key: "assessment" },
{ id: 6, title: "Save", icon: Save, key: "save" }];


const emptyAddress = {
  streetNumber: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  stateRegion: "",
  country: "Vietnam",
  postalCode: ""
};

const initialProductData: ProductAssessmentData = {
  productCode: "",
  productName: "",
  productType: "",
  weightPerUnit: 0,
  quantity: 0,
  materials: [],
  accessories: [],
  productionProcesses: [],
  energySources: [],
  manufacturingLocation: "",
  wasteRecovery: "",
  destinationMarket: "",
  originAddress: { ...emptyAddress },
  destinationAddress: { ...emptyAddress },
  transportLegs: [],
  estimatedTotalDistance: 0,
  status: "draft",
  version: 1
};

type AssessmentMode = "page" | "modal";
const MODAL_CREATE_DRAFT_STORAGE_KEY = "assessment_modal_create_draft_v1";

interface AssessmentClientProps {
  mode?: AssessmentMode;
  initialData?: ProductAssessmentData | null;
  productId?: string | null;
  onClose?: () => void;
  onCompleted?: (result: {
    id: string;
    status: "draft" | "published";
    isUpdate: boolean;
  }) => void;
}

const cloneInitialData = (
initialData?: ProductAssessmentData | null)
: ProductAssessmentData => {
  if (!initialData) {
    return {
      ...initialProductData,
      originAddress: { ...emptyAddress },
      destinationAddress: { ...emptyAddress },
      materials: [],
      accessories: [],
      productionProcesses: [],
      energySources: [],
      transportLegs: []
    };
  }

  return {
    ...initialProductData,
    ...initialData,
    originAddress: { ...emptyAddress, ...(initialData.originAddress ?? {}) },
    destinationAddress: {
      ...emptyAddress,
      ...(initialData.destinationAddress ?? {})
    },
    materials: (initialData.materials ?? []).map((item) => ({
      ...item,
      certifications: [...(item.certifications ?? [])]
    })),
    accessories: (initialData.accessories ?? []).map((item) => ({ ...item })),
    productionProcesses: [...(initialData.productionProcesses ?? [])],
    energySources: (initialData.energySources ?? []).map((item) => ({
      ...item
    })),
    transportLegs: (initialData.transportLegs ?? []).map((item) => ({
      ...item
    })),
    carbonResults: initialData.carbonResults ?
    {
      ...initialData.carbonResults,
      perProduct: { ...initialData.carbonResults.perProduct },
      totalBatch: { ...initialData.carbonResults.totalBatch },
      proxyNotes: [...(initialData.carbonResults.proxyNotes ?? [])]
    } :
    undefined,
    status: initialData.status === "published" ? "published" : "draft",
    version: Math.max(1, initialData.version || 1)
  };
};

const readModalCreateDraft = (): ProductAssessmentData | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.sessionStorage.getItem(
      MODAL_CREATE_DRAFT_STORAGE_KEY
    );
    if (!rawDraft) return null;

    const parsed = JSON.parse(rawDraft) as ProductAssessmentData;
    if (!parsed || typeof parsed !== "object") return null;

    return cloneInitialData(parsed);
  } catch {
    return null;
  }
};

const saveModalCreateDraft = (data: ProductAssessmentData) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      MODAL_CREATE_DRAFT_STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch {

  }
};

const clearModalCreateDraft = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(MODAL_CREATE_DRAFT_STORAGE_KEY);
  } catch {

  }
};

const resolveInitialProductData = ({
  mode,
  isEditing,
  initialData




}: {mode: AssessmentMode;isEditing: boolean;initialData?: ProductAssessmentData | null;}): ProductAssessmentData => {
  if (mode === "modal" && !isEditing && !initialData) {
    const storedDraft = readModalCreateDraft();
    if (storedDraft) {
      return storedDraft;
    }
  }

  return cloneInitialData(initialData);
};

const isSameValue = (a: unknown, b: unknown) => {
  if (Object.is(a, b)) return true;

  const isObjectA = typeof a === "object" && a !== null;
  const isObjectB = typeof b === "object" && b !== null;
  if (!isObjectA || !isObjectB) return false;

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

export default function AssessmentClient({
  mode = "page",
  initialData = null,
  productId = null,
  onClose,
  onCompleted
}: AssessmentClientProps) {
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const isModalMode = mode === "modal";
  const isEditing = Boolean(productId);
  const skipCreateDraftPersistenceRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] = useState<ProductAssessmentData>(() =>
  resolveInitialProductData({ mode, isEditing, initialData })
  );
  const [draftHistory, setDraftHistory] = useState<DraftVersion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isModalMode) return;
    setPageTitle("Product Assessment", "Create a new product assessment");
  }, [isModalMode, setPageTitle]);

  useEffect(() => {
    skipCreateDraftPersistenceRef.current = false;
    setCurrentStep(1);
    setDraftHistory([]);
    setIsSubmitting(false);
    setProductData(resolveInitialProductData({ mode, isEditing, initialData }));
  }, [initialData, isEditing, mode, productId]);

  useEffect(() => {
    if (!isModalMode || isEditing || skipCreateDraftPersistenceRef.current) {
      return;
    }

    saveModalCreateDraft(productData);
  }, [isModalMode, isEditing, productData]);

  const updateData = useCallback((updates: Partial<ProductAssessmentData>) => {
    setProductData((prev) => {
      const hasChanges = Object.entries(updates).some(([key, value]) => {
        const currentValue = prev[key as keyof ProductAssessmentData];
        return !isSameValue(currentValue, value);
      });

      if (!hasChanges) {
        return prev;
      }

      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const progress = (currentStep - 1) / (steps.length - 1) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          !!productData.productCode &&
          !!productData.productName &&
          !!productData.productType &&
          productData.weightPerUnit > 0 &&
          productData.quantity > 0);

      case 2:{
          const total = productData.materials.reduce(
            (sum, material) => sum + (material.percentage || 0),
            0
          );
          return productData.materials.length > 0 && total === 100;
        }
      case 3:{
          const total = productData.energySources.reduce(
            (sum, energy) => sum + (energy.percentage || 0),
            0
          );
          return productData.productionProcesses.length > 0 && total === 100;
        }
      case 4:
        return !!productData.destinationMarket;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      return;
    }

    if (isModalMode) {
      onClose?.();
    }
  };

  const persistProduct = async (nextStatus: "draft" | "published") => {
    const timestamp = new Date().toISOString();
    const nextVersion = Math.max(1, (productData.version || 0) + 1);
    const payload: ProductAssessmentData = {
      ...productData,
      status: nextStatus,
      version: nextVersion,
      createdAt: productData.createdAt || timestamp,
      updatedAt: timestamp
    };

    if (isEditing && productId) {
      const result = await updateProduct(productId, payload);
      return { result, timestamp, nextVersion };
    }

    const result = await createProduct(
      payload,
      nextStatus === "published" ? "publish" : "draft"
    );
    return { result, timestamp, nextVersion };
  };

  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { result, timestamp, nextVersion } = await persistProduct("draft");
      const draft: DraftVersion = {
        id: `draft-${Date.now()}`,
        version: nextVersion,
        data: {
          ...productData,
          status: "draft",
          version: result.version,
          updatedAt: timestamp
        },
        timestamp
      };

      setDraftHistory((prev) => [draft, ...prev]);
      setProductData((prev) => ({
        ...prev,
        status: "draft",
        version: result.version,
        createdAt: prev.createdAt || timestamp,
        updatedAt: timestamp
      }));

      toast.success(
        isEditing ?
        "Đã cập nhật sản phẩm nháp thành công" :
        "Đã lưu nháp sản phẩm thành công"
      );

      if (isModalMode) {
        if (!isEditing) {
          skipCreateDraftPersistenceRef.current = true;
          clearModalCreateDraft();
        }
        onCompleted?.({
          id: result.id,
          status: "draft",
          isUpdate: isEditing
        });
        onClose?.();
      }
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Lưu nháp thất bại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { result, timestamp } = await persistProduct("published");

      setProductData((prev) => ({
        ...prev,
        status: "published",
        version: result.version,
        createdAt: prev.createdAt || timestamp,
        updatedAt: timestamp
      }));

      toast.success(
        isEditing ?
        "Đã cập nhật và xuất bản sản phẩm thành công" :
        "Xuất bản sản phẩm thành công"
      );

      if (isModalMode) {
        if (!isEditing) {
          skipCreateDraftPersistenceRef.current = true;
          clearModalCreateDraft();
        }
        onCompleted?.({
          id: result.id,
          status: "published",
          isUpdate: isEditing
        });
        onClose?.();
        return;
      }

      if (isValidProductId(result.id)) {
        router.push(`/summary/${result.id}`);
      } else {
        toast.error("Product ID is invalid. Please check backend response.");
        router.push("/products");
      }
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Xuất bản thất bại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs md:text-sm text-muted-foreground">
            Step {currentStep} / {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <StepIndicators currentStep={currentStep} steps={steps} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-base">
            {React.createElement(steps[currentStep - 1].icon, {
              className: "w-4 h-4 md:w-5 md:h-5"
            })}
            <span className="truncate">{steps[currentStep - 1].title}</span>
          </CardTitle>
          {currentStep < steps.length &&
          <CardDescription className="text-xs md:text-sm">
              Fill in the information below to continue
            </CardDescription>
          }
        </CardHeader>
        <CardContent>
          <StepContent
            currentStep={currentStep}
            data={productData}
            onChange={updateData}
            draftHistory={draftHistory}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isSubmitting={isSubmitting} />

        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 && !isModalMode}
          className="gap-2 w-full sm:w-auto">

          <ArrowLeft className="w-4 h-4" />
          {isModalMode && currentStep === 1 ? "Close" : "Back"}
        </Button>

        {currentStep < steps.length ?
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="gap-2 w-full sm:w-auto">

            Next
            <ArrowRight className="w-4 h-4" />
          </Button> :
        isModalMode ?
        <Button
          variant="outline"
          onClick={onClose}
          className="gap-2 w-full sm:w-auto">

            Close
            <CheckCircle2 className="w-4 h-4" />
          </Button> :

        <Button
          variant="outline"
          onClick={() => router.push("/products")}
          className="gap-2 w-full sm:w-auto">

            Back to Products
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        }
      </div>
    </div>);

}