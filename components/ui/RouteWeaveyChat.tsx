"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WeaveyChat = dynamic(() => import("./WeaveyChat"), {
  ssr: false,
  loading: () => null
});

const DASHBOARD_ROUTE_PREFIXES = [
"/assessment",
"/calculation-history",
"/export",
"/logistics",
"/overview",
"/passport",
"/products",
"/reports",
"/settings",
"/summary",
"/track-shipment",
"/transport"];


const shouldShowWeaveyChat = (pathname: string | null) => {
  if (!pathname) return false;

  return DASHBOARD_ROUTE_PREFIXES.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
};

const RouteWeaveyChat = () => {
  const pathname = usePathname();

  if (!shouldShowWeaveyChat(pathname)) {
    return null;
  }

  return <WeaveyChat variant="dashboard" />;
};

export default RouteWeaveyChat;