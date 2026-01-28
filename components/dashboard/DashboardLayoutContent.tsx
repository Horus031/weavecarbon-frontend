"use client";

import React from "react";
import DashboardHeaderButton from "./DashboardHeaderButton";
import { useDashboardTitle } from "@/contexts/DashboardContext";

interface DashboardLayoutContentProps {
  children: React.ReactNode;
}

export default function DashboardLayoutContent({
  children,
}: DashboardLayoutContentProps) {
  const { title, subtitle } = useDashboardTitle();

  return (
    <>
      <header className="bg-card border-b border-border p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 fixed lg:relative w-full top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <DashboardHeaderButton />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold truncate">
              {title}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              {subtitle}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 pt-24 md:p-6 md:pt-24 lg:pt-3">{children}</div>
    </>
  );
}
