"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";
import { Company } from "@/types/app.type";

interface DashboardSidebarShellProps {
  company: Company | null;
}

const ACCOUNT_ENDPOINT_ENABLED =
process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT !== "0";

export default function DashboardSidebarShell({
  company
}: DashboardSidebarShellProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [resolvedCompany, setResolvedCompany] = useState<Company | null>(
    company
  );

  useEffect(() => {
    setMounted(true);


    const initializeSidebarState = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    initializeSidebarState();


    const handleToggle = () => {
      setSidebarOpen((prev) => !prev);
    };


    const handleResize = () => {

      if (window.innerWidth >= 1024) {

        setSidebarOpen(true);
      } else {

        setSidebarOpen(false);
      }
    };

    window.addEventListener("toggleSidebar", handleToggle);
    window.addEventListener("resize", handleResize);


    const handleCloseOnNavigation = () => {

      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("sidebarNavigate", handleCloseOnNavigation);

    return () => {
      window.removeEventListener("toggleSidebar", handleToggle);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("sidebarNavigate", handleCloseOnNavigation);
    };
  }, []);

  useEffect(() => {
    setResolvedCompany(company);
  }, [company]);

  useEffect(() => {
    let cancelled = false;

    const loadCompany = async () => {
      if (company || !user || !ACCOUNT_ENDPOINT_ENABLED) return;

      try {
        const account = await api.get<{company?: Company | null;}>("/account");
        if (!cancelled) {
          setResolvedCompany(account?.company || null);
        }
      } catch {
        if (!cancelled) {
          setResolvedCompany(null);
        }
      }
    };

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [company, user]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    }
  };


  if (!mounted) {
    return null;
  }

  return (
    <DashboardSidebar
      company={resolvedCompany}
      profile={user}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={handleToggleSidebar} />);


}