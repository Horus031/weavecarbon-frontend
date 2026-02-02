/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Company } from "@/types/app.type";

interface DashboardSidebarShellProps {
  company: Company | null;
}

export default function DashboardSidebarShell({
  company,
}: DashboardSidebarShellProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize sidebar state based on screen size
    const initializeSidebarState = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    initializeSidebarState();

    // Listen for toggle events from header
    const handleToggle = () => {
      setSidebarOpen((prev) => !prev);
    };

    // Handle window resize - adjust sidebar based on screen size
    const handleResize = () => {
      // Only auto-adjust when crossing the lg breakpoint
      if (window.innerWidth >= 1024) {
        // Desktop: keep sidebar open
        setSidebarOpen(true);
      } else {
        // Mobile: close sidebar
        setSidebarOpen(false);
      }
    };

    window.addEventListener("toggleSidebar", handleToggle);
    window.addEventListener("resize", handleResize);

    // Also close sidebar when navigating on mobile
    const handleCloseOnNavigation = () => {
      // Only close on mobile
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

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <DashboardSidebar
      company={company}
      profile={user}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={handleToggleSidebar}
    />
  );
}
