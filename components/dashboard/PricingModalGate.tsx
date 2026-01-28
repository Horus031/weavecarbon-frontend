/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import PricingModal from "@/components/dashboard/PricingModal";

export default function PricingModalGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenPricing = localStorage.getItem("weavecarbon_pricing_seen");
    if (!hasSeenPricing) {
      setOpen(true);
    }
  }, []);

  return (
    <PricingModal
      open={open}
      onClose={() => {
        localStorage.setItem("weavecarbon_pricing_seen", "true");
        setOpen(false);
      }}
    />
  );
}
