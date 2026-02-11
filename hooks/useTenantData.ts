import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";

interface TenantStats {
  productsCount: number;
  shipmentsCount: number;
  hasData: boolean;
  loading: boolean;
}

export const useTenantData = (): TenantStats => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TenantStats>({
    productsCount: 0,
    shipmentsCount: 0,
    hasData: false,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStats({
          productsCount: 0,
          shipmentsCount: 0,
          hasData: false,
          loading: false,
        });
        return;
      }

      try {
        const data = await api.get<{
          productsCount?: number;
          shipmentsCount?: number;
        }>("/dashboard/tenant-stats");

        const productsCount = data?.productsCount ?? 0;
        const shipmentsCount = data?.shipmentsCount ?? 0;

        setStats({
          productsCount,
          shipmentsCount,
          hasData: productsCount > 0 || shipmentsCount > 0,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching tenant stats:", error);
        setStats({
          productsCount: 0,
          shipmentsCount: 0,
          hasData: false,
          loading: false,
        });
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};

