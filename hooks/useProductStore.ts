/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import {
  ProductData,
  TransportData,
  CalculationHistory,
  DEMO_PRODUCTS,
  DEMO_TRANSPORTS,
  DEMO_HISTORY,
} from "@/lib/demoData";

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

    // Combine demo data with user data
    setProducts([...DEMO_PRODUCTS, ...userProducts]);
    setTransports([...DEMO_TRANSPORTS, ...userTransports]);
    setHistory([...DEMO_HISTORY, ...userHistory]);
    setIsLoaded(true);
  }, []);

  // Save user data to localStorage (excluding demo data)
  const saveProducts = (allProducts: ProductData[]) => {
    const userProducts = allProducts.filter((p) => !p.isDemo);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(userProducts));
    setProducts(allProducts);
  };

  const saveTransports = (allTransports: TransportData[]) => {
    const userTransports = allTransports.filter((t) => !t.isDemo);
    localStorage.setItem(TRANSPORTS_KEY, JSON.stringify(userTransports));
    setTransports(allTransports);
  };

  const saveHistory = (allHistory: CalculationHistory[]) => {
    const userHistory = allHistory.filter((h) => !h.isDemo);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(userHistory));
    setHistory(allHistory);
  };

  const addProduct = (
    product: Omit<ProductData, "id" | "createdAt" | "isDemo">,
    userEmail: string,
  ) => {
    const newProduct: ProductData = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDemo: false,
      createdBy: userEmail,
    };
    saveProducts([...products, newProduct]);
    return newProduct;
  };

  const addTransport = (
    transport: Omit<TransportData, "id" | "createdAt" | "isDemo">,
    userEmail: string,
  ) => {
    const newTransport: TransportData = {
      ...transport,
      id: `transport-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDemo: false,
      createdBy: userEmail,
    };
    saveTransports([...transports, newTransport]);
    return newTransport;
  };

  const addHistory = (
    calc: Omit<CalculationHistory, "id" | "createdAt" | "isDemo">,
    userEmail: string,
  ) => {
    const newCalc: CalculationHistory = {
      ...calc,
      id: `calc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDemo: false,
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

  const getDemoProducts = () => products.filter((p) => p.isDemo);
  const getUserProducts = () => products.filter((p) => !p.isDemo);

  const getDemoHistory = () => history.filter((h) => h.isDemo);
  const getUserHistory = () => history.filter((h) => !h.isDemo);

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
    getDemoProducts,
    getUserProducts,
    getDemoHistory,
    getUserHistory,
  };
}
