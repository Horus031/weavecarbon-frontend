"use client";

import React from "react";
import Step1Content from "./steps/Step1Content";
import Step2Content from "./steps/Step2Content";
import Step3Content from "./steps/Step3Content";
import Step4Content from "./steps/Step4Content";
import Step5Content from "./steps/Step5Content";

export interface ProductData {
  productName: string;
  productCode: string;
  category: string;
  description: string;
  weight: string;
  unit: string;
  primaryMaterial: string;
  materialPercentage: string;
  secondaryMaterial: string;
  secondaryPercentage: string;
  recycledContent: string;
  certifications: string[];
  manufacturingLocation: string;
  energySource: string;
  processType: string;
  wasteRecovery: string;
  originCountry: string;
  destinationMarket: string;
  transportMode: string;
  packagingType: string;
  packagingWeight: string;
}

interface StepContentProps {
  currentStep: number;
  productData: ProductData;
  updateField: (field: keyof ProductData, value: string | string[]) => void;
  categories: Array<{ value: string; label: string }>;
  materials: Array<{ value: string; label: string }>;
  certifications: Array<{ value: string; label: string }>;
  energySources: Array<{ value: string; label: string }>;
  transportModes: Array<{ value: string; label: string }>;
  markets: Array<{ value: string; label: string }>;
}

export default function StepContent({
  currentStep,
  productData,
  updateField,
  categories,
  materials,
  certifications,
  energySources,
  transportModes,
  markets,
}: StepContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <Step1Content
          productData={productData}
          updateField={updateField}
          categories={categories}
        />
      );
    case 2:
      return (
        <Step2Content
          productData={productData}
          updateField={updateField}
          materials={materials}
          certifications={certifications}
        />
      );
    case 3:
      return (
        <Step3Content
          productData={productData}
          updateField={updateField}
          energySources={energySources}
        />
      );
    case 4:
      return (
        <Step4Content
          productData={productData}
          updateField={updateField}
          transportModes={transportModes}
          markets={markets}
        />
      );
    case 5:
      return (
        <Step5Content
          productData={productData}
          markets={markets}
          transportModes={transportModes}
        />
      );
    default:
      return null;
  }
}
