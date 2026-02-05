"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Save,
} from "lucide-react";
import StepIndicators from "./StepIndicators";
import StepContent from "./StepContent";
import { DraftVersion, ProductAssessmentData } from "./steps/types";

interface StoredProduct extends ProductAssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const steps = [
  { id: 1, title: "Product Info", icon: Package, key: "productInfo" },
  { id: 2, title: "Materials", icon: Leaf, key: "materials" },
  { id: 3, title: "Manufacturing", icon: Factory, key: "manufacturing" },
  { id: 4, title: "Logistics", icon: Truck, key: "logistics" },
  { id: 5, title: "Assessment", icon: CheckCircle2, key: "assessment" },
  { id: 6, title: "Save", icon: Save, key: "save" },
];

const emptyAddress = {
  streetNumber: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  stateRegion: "",
  country: "Vietnam",
  postalCode: "",
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
  version: 1,
};

export default function AssessmentClient() {
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] =
    useState<ProductAssessmentData>(initialProductData);
  const [draftHistory, setDraftHistory] = useState<DraftVersion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPageTitle("Product Assessment", "Create a new product assessment");
  }, [setPageTitle]);

  const updateData = (updates: Partial<ProductAssessmentData>) => {
    setProductData((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          !!productData.productCode &&
          !!productData.productName &&
          !!productData.productType &&
          productData.weightPerUnit > 0 &&
          productData.quantity > 0
        );
      case 2: {
        const total = productData.materials.reduce(
          (sum, m) => sum + (m.percentage || 0),
          0,
        );
        return productData.materials.length > 0 && total === 100;
      }
      case 3: {
        const total = productData.energySources.reduce(
          (sum, e) => sum + (e.percentage || 0),
          0,
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
    }
  };

  const handleSaveDraft = () => {
    const nextVersion = (productData.version || 0) + 1;
    const timestamp = new Date().toISOString();
    const productId = `product-${Date.now()}`;
    
    const draft: DraftVersion = {
      id: `draft-${Date.now()}`,
      version: nextVersion,
      data: {
        ...productData,
        status: "draft",
        version: nextVersion,
        updatedAt: timestamp,
      },
      timestamp,
    };
    
    // Save to localStorage
    const storedProduct: StoredProduct = {
      ...productData,
      id: productId,
      status: "draft",
      version: nextVersion,
      createdAt: productData.createdAt || timestamp,
      updatedAt: timestamp,
    } as StoredProduct;
    
    // Get existing products from localStorage
    const existingProducts = JSON.parse(
      localStorage.getItem("weavecarbonProducts") || "[]",
    ) as StoredProduct[];
    
    // Add new product
    const updatedProducts = [storedProduct, ...existingProducts];
    localStorage.setItem("weavecarbonProducts", JSON.stringify(updatedProducts));
    
    setDraftHistory((prev) => [draft, ...prev]);
    setProductData((prev) => ({
      ...prev,
      status: "draft",
      version: nextVersion,
      createdAt: prev.createdAt || timestamp,
      updatedAt: timestamp,
    }));
    
    // Show success message
    alert("Sản phẩm đã lưu nháp thành công");
  };

  const handlePublish = () => {
    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const productId = `product-${Date.now()}`;
      const nextVersion = (productData.version || 0) + 1;

      // Create product to store
      const publishedProduct: StoredProduct = {
        ...productData,
        id: productId,
        status: "published",
        version: nextVersion,
        createdAt: productData.createdAt || timestamp,
        updatedAt: timestamp,
      } as StoredProduct;

      // Get existing products from localStorage
      const existingProducts = JSON.parse(
        localStorage.getItem("weavecarbonProducts") || "[]",
      ) as StoredProduct[];

      // Add new product
      const updatedProducts = [publishedProduct, ...existingProducts];
      localStorage.setItem("weavecarbonProducts", JSON.stringify(updatedProducts));

      setProductData((prev) => ({
        ...prev,
        status: "published",
        version: nextVersion,
        createdAt: prev.createdAt || timestamp,
        updatedAt: timestamp,
      }));

      // Redirect to summary page
      router.push(`/products`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
        {/* Progress header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs md:text-sm text-muted-foreground">
              Step {currentStep} / {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <StepIndicators currentStep={currentStep} steps={steps} />

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-base">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "w-4 h-4 md:w-5 md:h-5",
              })}
              <span className="truncate">{steps[currentStep - 1].title}</span>
            </CardTitle>
            {currentStep < steps.length && (
              <CardDescription className="text-xs md:text-sm">
                Fill in the information below to continue
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <StepContent
              currentStep={currentStep}
              data={productData}
              onChange={updateData}
              draftHistory={draftHistory}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 w-full sm:w-auto"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/products")}
              className="gap-2 w-full sm:w-auto"
            >
              Back to Products
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
