"use client";

import React from "react";
import Step1Content from "./steps/Step1Content";
import Step2Content from "./steps/Step2Content";
import Step3Content from "./steps/Step3Content";
import Step4Content from "./steps/Step4Content";
import Step5Content from "./steps/Step5Content";
import Step6Content from "./steps/Step6Content";
import { DraftVersion, ProductAssessmentData } from "./steps/types";

interface StepContentProps {
  currentStep: number;
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
  draftHistory: DraftVersion[];
  onSaveDraft: () => void;
  onPublish: () => void;
  isSubmitting?: boolean;
}

export default function StepContent({
  currentStep,
  data,
  onChange,
  draftHistory,
  onSaveDraft,
  onPublish,
  isSubmitting,
}: StepContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <Step1Content
          data={data}
          onChange={onChange}
        />
      );
    case 2:
      return (
        <Step2Content
          data={data}
          onChange={onChange}
        />
      );
    case 3:
      return (
        <Step3Content
          data={data}
          onChange={onChange}
        />
      );
    case 4:
      return (
        <Step4Content
          data={data}
          onChange={onChange}
        />
      );
    case 5:
      return (
        <Step5Content
          data={data}
          onChange={onChange}
        />
      );
    case 6:
      return (
        <Step6Content
          data={data}
          draftHistory={draftHistory}
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          isSubmitting={isSubmitting}
        />
      );
    default:
      return null;
  }
}
