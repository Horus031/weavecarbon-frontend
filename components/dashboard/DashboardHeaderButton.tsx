"use client";

import React from "react";
import { Menu } from "lucide-react";

export default function DashboardHeaderButton() {
  const handleToggleSidebar = () => {
    const event = new CustomEvent("toggleSidebar");
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleToggleSidebar}
      className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
      title="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
