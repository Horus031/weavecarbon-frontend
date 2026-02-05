"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AddressInput } from "@/components/dashboard/assessment/types";

export type BatchStatus = "draft" | "published";

export interface BatchProduct {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  co2PerUnit: number;
  weight: number;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  status: BatchStatus;
  products: BatchProduct[];

  // Totals
  totalProducts: number;
  totalQuantity: number;
  totalCO2: number;
  totalWeight: number;

  // Logistics info (copied from first product or set manually)
  originAddress?: AddressInput;
  destinationAddress?: AddressInput;
  destinationMarket?: string;
  transportModes?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Metadata
  shipmentId?: string;
  isDemo?: boolean;
}

interface BatchContextType {
  batches: Batch[];

  // CRUD
  createBatch: (name: string, description?: string) => Batch;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;

  // Product management
  addProductToBatch: (batchId: string, product: BatchProduct) => void;
  removeProductFromBatch: (batchId: string, productId: string) => void;

  // Status
  publishBatch: (id: string) => Batch;

  // Query
  getBatch: (id: string) => Batch | undefined;
  getBatchesByStatus: (status: BatchStatus | "all") => Batch[];
  getBatchByProduct: (productId: string) => Batch | undefined;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

// Demo batches
const generateDemoBatches = (): Batch[] => {
  const now = new Date();

  return [
    {
      id: "batch-demo-001",
      name: "Lô xuất EU Q1-2024",
      description: "Lô hàng xuất khẩu sang châu Âu quý 1/2024",
      status: "published",
      products: [
        {
          productId: "demo-product-001",
          name: "Áo T-shirt Organic Cotton",
          sku: "DEMO-SKU-001",
          quantity: 500,
          co2PerUnit: 3.45,
          weight: 0.25,
        },
        {
          productId: "demo-product-002",
          name: "Quần Jeans Recycled Denim",
          sku: "DEMO-SKU-002",
          quantity: 300,
          co2PerUnit: 5.82,
          weight: 0.65,
        },
        {
          productId: "demo-product-009",
          name: "Áo Polo Pique",
          sku: "DEMO-SKU-009",
          quantity: 200,
          co2PerUnit: 3.12,
          weight: 0.28,
        },
      ],
      totalProducts: 3,
      totalQuantity: 1000,
      totalCO2: 4995, // Sum of (quantity * co2PerUnit)
      totalWeight: 475,
      originAddress: {
        streetNumber: "123",
        street: "Đại lộ Bình Dương",
        ward: "",
        district: "Thuận An",
        city: "Bình Dương",
        stateRegion: "",
        country: "Vietnam",
        postalCode: "75000",
      },
      destinationAddress: {
        streetNumber: "100",
        street: "Europaweg",
        ward: "",
        district: "",
        city: "Rotterdam",
        stateRegion: "South Holland",
        country: "Netherlands",
        postalCode: "3199 LC",
      },
      destinationMarket: "eu",
      transportModes: ["road", "sea"],
      createdAt: new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: now.toISOString(),
      publishedAt: new Date(
        now.getTime() - 25 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      shipmentId: "SHIP-2024-003",
      isDemo: true,
    },
    {
      id: "batch-demo-002",
      name: "Lô xuất US Xuân 2024",
      description: "Lô hàng mùa xuân cho thị trường Mỹ",
      status: "draft",
      products: [
        {
          productId: "demo-product-004",
          name: "Áo Hoodie Fleece",
          sku: "DEMO-SKU-004",
          quantity: 400,
          co2PerUnit: 4.21,
          weight: 0.45,
        },
        {
          productId: "demo-product-005",
          name: "Áo Sơ mi Cotton",
          sku: "DEMO-SKU-005",
          quantity: 250,
          co2PerUnit: 2.95,
          weight: 0.22,
        },
      ],
      totalProducts: 2,
      totalQuantity: 650,
      totalCO2: 2421.5,
      totalWeight: 235,
      originAddress: {
        streetNumber: "88",
        street: "Nguyễn Văn Linh",
        ward: "",
        district: "Hải Châu",
        city: "Đà Nẵng",
        stateRegion: "",
        country: "Vietnam",
        postalCode: "550000",
      },
      destinationAddress: {
        streetNumber: "456",
        street: "Harbor Blvd",
        ward: "",
        district: "",
        city: "Los Angeles",
        stateRegion: "California",
        country: "USA",
        postalCode: "90001",
      },
      destinationMarket: "us",
      transportModes: ["road", "sea"],
      createdAt: new Date(
        now.getTime() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: now.toISOString(),
      isDemo: true,
    },
  ];
};

export const BatchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [batches, setBatches] = useState<Batch[]>(generateDemoBatches());

  const createBatch = useCallback(
    (name: string, description?: string): Batch => {
      const newBatch: Batch = {
        id: `batch-${Date.now()}`,
        name,
        description,
        status: "draft",
        products: [],
        totalProducts: 0,
        totalQuantity: 0,
        totalCO2: 0,
        totalWeight: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setBatches((prev) => [newBatch, ...prev]);
      return newBatch;
    },
    [],
  );

  const updateBatch = useCallback((id: string, updates: Partial<Batch>) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, ...updates, updatedAt: new Date().toISOString() }
          : b,
      ),
    );
  }, []);

  const deleteBatch = useCallback((id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const recalculateTotals = (products: BatchProduct[]) => ({
    totalProducts: products.length,
    totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
    totalCO2: products.reduce((sum, p) => sum + p.quantity * p.co2PerUnit, 0),
    totalWeight: products.reduce((sum, p) => sum + p.quantity * p.weight, 0),
  });

  const addProductToBatch = useCallback(
    (batchId: string, product: BatchProduct) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;

          // Check if product already exists
          if (b.products.some((p) => p.productId === product.productId)) {
            return b;
          }

          const newProducts = [...b.products, product];
          const totals = recalculateTotals(newProducts);

          return {
            ...b,
            products: newProducts,
            ...totals,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const removeProductFromBatch = useCallback(
    (batchId: string, productId: string) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;

          const newProducts = b.products.filter(
            (p) => p.productId !== productId,
          );
          const totals = recalculateTotals(newProducts);

          return {
            ...b,
            products: newProducts,
            ...totals,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const publishBatch = useCallback(
    (id: string): Batch => {
      let publishedBatch: Batch | null = null;

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;

          publishedBatch = {
            ...b,
            status: "published",
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return publishedBatch;
        }),
      );

      return publishedBatch || batches.find((b) => b.id === id)!;
    },
    [batches],
  );

  const getBatch = useCallback(
    (id: string) => {
      return batches.find((b) => b.id === id);
    },
    [batches],
  );

  const getBatchesByStatus = useCallback(
    (status: BatchStatus | "all") => {
      if (status === "all") return batches;
      return batches.filter((b) => b.status === status);
    },
    [batches],
  );

  const getBatchByProduct = useCallback(
    (productId: string) => {
      return batches.find((b) =>
        b.products.some((p) => p.productId === productId),
      );
    },
    [batches],
  );

  return (
    <BatchContext.Provider
      value={{
        batches,
        createBatch,
        updateBatch,
        deleteBatch,
        addProductToBatch,
        removeProductFromBatch,
        publishBatch,
        getBatch,
        getBatchesByStatus,
        getBatchByProduct,
      }}
    >
      {children}
    </BatchContext.Provider>
  );
};

export const useBatches = () => {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error("useBatches must be used within a BatchProvider");
  }
  return context;
};
