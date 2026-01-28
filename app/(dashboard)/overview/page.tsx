import React from "react";
import {
  marketReadiness,
  recommendations,
  dashboardStats,
} from "@/lib/dashboardData";
import OverviewPageClient from "@/components/dashboard/overview/OverviewPageClient";

interface Company {
  target_markets: string[] | null;
}

// Mock company (no DB yet)
const mockCompany: Company = {
  target_markets: ["US", "EU"],
};

const OverviewPage: React.FC = () => {
  const company = mockCompany;
  const stats = dashboardStats;

  return (
    <OverviewPageClient
      company={company}
      stats={stats}
      marketReadiness={marketReadiness}
      recommendations={recommendations}
    />
  );
};

export default OverviewPage;
