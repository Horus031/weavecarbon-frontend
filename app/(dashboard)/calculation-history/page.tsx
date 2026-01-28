import React from "react";
import { Suspense } from "react";
import CalculationHistoryClient from "@/components/dashboard/calculation-history/CalculationHistoryClient";

interface CalculationHistoryPageProps {
  searchParams: {
    productId?: string;
  };
}

const CalculationHistoryPage: React.FC<CalculationHistoryPageProps> = async ({
  searchParams,
}) => {
  const productId = searchParams?.productId || null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <CalculationHistoryClient productId={productId} />
    </Suspense>
  );
};

export default CalculationHistoryPage;
