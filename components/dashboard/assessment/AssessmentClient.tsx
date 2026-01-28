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
} from "lucide-react";
import StepIndicators from "./StepIndicators";
import StepContent, { ProductData } from "./StepContent";

interface AssessmentClientProps {
  categories: Array<{ value: string; label: string }>;
  materials: Array<{ value: string; label: string }>;
  certifications: Array<{ value: string; label: string }>;
  energySources: Array<{ value: string; label: string }>;
  transportModes: Array<{ value: string; label: string }>;
  markets: Array<{ value: string; label: string }>;
}

const steps = [
  { id: 1, title: "Product Info", icon: Package, key: "productInfo" },
  { id: 2, title: "Materials", icon: Leaf, key: "materials" },
  { id: 3, title: "Manufacturing", icon: Factory, key: "manufacturing" },
  { id: 4, title: "Logistics", icon: Truck, key: "logistics" },
  { id: 5, title: "Complete", icon: CheckCircle2, key: "complete" },
];

const initialProductData: ProductData = {
  productName: "",
  productCode: "",
  category: "",
  description: "",
  weight: "",
  unit: "kg",
  primaryMaterial: "",
  materialPercentage: "",
  secondaryMaterial: "",
  secondaryPercentage: "",
  recycledContent: "",
  certifications: [],
  manufacturingLocation: "Vietnam",
  energySource: "",
  processType: "",
  wasteRecovery: "",
  originCountry: "Vietnam",
  destinationMarket: "",
  transportMode: "",
  packagingType: "",
  packagingWeight: "",
};

export default function AssessmentClient({
  categories,
  materials,
  certifications,
  energySources,
  transportModes,
  markets,
}: AssessmentClientProps) {
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] =
    useState<ProductData>(initialProductData);

  useEffect(() => {
    setPageTitle("Product Assessment", "Create a new product assessment");
  }, [setPageTitle]);

  const updateField = (field: keyof ProductData, value: string | string[]) => {
    setProductData((prev) => ({ ...prev, [field]: value }));
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          productData.productName && productData.category && productData.weight
        );
      case 2:
        return productData.primaryMaterial && productData.materialPercentage;
      case 3:
        return productData.energySource && productData.processType;
      case 4:
        return productData.destinationMarket && productData.transportMode;
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

  const handleSubmit = () => {
    router.push("/overview");
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Product Assessment</h2>
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
          {currentStep < 5 && (
            <CardDescription className="text-xs md:text-sm">
              Fill in the information below to continue
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <StepContent
            currentStep={currentStep}
            productData={productData}
            updateField={updateField}
            categories={categories}
            materials={materials}
            certifications={certifications}
            energySources={energySources}
            transportModes={transportModes}
            markets={markets}
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

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2 w-full sm:w-auto"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="gap-2 w-full sm:w-auto">
            View Results
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
