/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import type {
  ProductData,
  TransportData,
  CalculationHistory,
} from "@/types/productData";

const PRODUCTS_KEY = "weavecarbon_products";
const TRANSPORTS_KEY = "weavecarbon_transports";
const HISTORY_KEY = "weavecarbon_history";

export function useProductStore() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [transports, setTransports] = useState<TransportData[]>([]);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedProducts = localStorage.getItem(PRODUCTS_KEY);
    const storedTransports = localStorage.getItem(TRANSPORTS_KEY);
    const storedHistory = localStorage.getItem(HISTORY_KEY);

    const userProducts = storedProducts ? JSON.parse(storedProducts) : [];
    const userTransports = storedTransports ? JSON.parse(storedTransports) : [];
    const userHistory = storedHistory ? JSON.parse(storedHistory) : [];

    setProducts(userProducts);
    setTransports(userTransports);
    setHistory(userHistory);
    setIsLoaded(true);
  }, []);

  // Save user data to localStorage
  const saveProducts = (allProducts: ProductData[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(allProducts));
    setProducts(allProducts);
  };

  const saveTransports = (allTransports: TransportData[]) => {
    localStorage.setItem(TRANSPORTS_KEY, JSON.stringify(allTransports));
    setTransports(allTransports);
  };

  const saveHistory = (allHistory: CalculationHistory[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    setHistory(allHistory);
  };

  const addProduct = (
    product: Omit<ProductData, "id" | "createdAt">,
    userEmail: string,
  ) => {
    const newProduct: ProductData = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    saveProducts([...products, newProduct]);
    return newProduct;
  };

  const addTransport = (
    transport: Omit<TransportData, "id" | "createdAt">,
    userEmail: string,
  ) => {
    const newTransport: TransportData = {
      ...transport,
      id: `transport-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    saveTransports([...transports, newTransport]);
    return newTransport;
  };

  const addHistory = (
    calc: Omit<CalculationHistory, "id" | "createdAt">,
    userEmail: string,
  ) => {
    const newCalc: CalculationHistory = {
      ...calc,
      id: `calc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
    };
    saveHistory([...history, newCalc]);
    return newCalc;
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);
  const getTransport = (id: string) => transports.find((t) => t.id === id);
  const getTransportByProduct = (productId: string) =>
    transports.find((t) => t.productId === productId);
  const getHistoryByProduct = (productId: string) =>
    history.filter((h) => h.productId === productId);

  return {
    products,
    transports,
    history,
    isLoaded,
    addProduct,
    addTransport,
    addHistory,
    getProduct,
    getTransport,
    getTransportByProduct,
    getHistoryByProduct,
  };
}
