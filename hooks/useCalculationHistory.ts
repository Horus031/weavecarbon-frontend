import { useCallback, useState, useEffect } from "react";

export interface CalculationHistoryItem {
  id: string;
  productId: string;
  productName: string;
  materialsCO2: number;
  manufacturingCO2: number;
  transportCO2: number;
  packagingCO2: number;
  totalCO2: number;
  carbonVersion: string;
  createdAt: string;
  createdBy: string;
  isDemo: boolean;
}

const STORAGE_KEY = "weavecarbon_calculation_history";

export const useCalculationHistory = () => {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading calculation history:", error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Error saving calculation history:", error);
      }
    }
  }, [history, isLoaded]);

  const addCalculation = useCallback(
    (calculation: Omit<CalculationHistoryItem, "id" | "createdAt">) => {
      const newItem: CalculationHistoryItem = {
        ...calculation,
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [newItem, ...prev]);
      return newItem;
    },
    []
  );

  const deleteCalculation = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getByProductId = useCallback(
    (productId: string) => {
      return history.filter((item) => item.productId === productId);
    },
    [history]
  );

  const getDemoHistory = useCallback(() => {
    return history.filter((item) => item.isDemo);
  }, [history]);

  const getRealHistory = useCallback(() => {
    return history.filter((item) => !item.isDemo);
  }, [history]);

  return {
    history,
    isLoaded,
    addCalculation,
    deleteCalculation,
    getByProductId,
    getDemoHistory,
    getRealHistory,
  };
};
