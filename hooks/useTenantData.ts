import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TenantStats {
  productsCount: number;
  shipmentsCount: number;
  hasData: boolean;
  loading: boolean;
}

// Simulated data generator for demo purposes
const generateDemoStats = () => {
  const productsCount = Math.floor(Math.random() * 15) + 5; // 5-20 products
  const shipmentsCount = Math.floor(Math.random() * 30) + 10; // 10-40 shipments
  return {
    productsCount,
    shipmentsCount,
    hasData: true,
  };
};

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
        setStats((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        // TODO: Replace with actual database queries once products and shipments tables are created
        // For now, using simulated data for demonstration
        const demoStats = generateDemoStats();

        setStats({
          productsCount: demoStats.productsCount,
          shipmentsCount: demoStats.shipmentsCount,
          hasData: demoStats.hasData,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching tenant stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};

// Hook to check if current user is in demo mode
export const useIsDemo = (): boolean => {
  const { user } = useAuth();
  return user?.is_demo_user || false;
};
