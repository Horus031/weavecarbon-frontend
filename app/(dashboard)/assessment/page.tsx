import React from "react";
import AssessmentClient from "@/components/dashboard/assessment/AssessmentClient";
import {
  categories,
  materials,
  certifications,
  energySources,
  transportModes,
  markets,
} from "@/lib/assessmentData";

const AssessmentPage: React.FC = () => {
  return (
    <AssessmentClient
      categories={categories}
      materials={materials}
      certifications={certifications}
      energySources={energySources}
      transportModes={transportModes}
      markets={markets}
    />
  );
};

export default AssessmentPage;
