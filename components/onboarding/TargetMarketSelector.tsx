"use client";

import React from "react";
import { Label } from "@/components/ui/label";

interface TargetMarketSelectorProps {
  selectedMarkets: string[];
  onToggle: (market: string) => void;
  disabled?: boolean;
}

const markets = ["EU", "US", "JP", "KR", "AU", "ASEAN"];

const TargetMarketSelector: React.FC<TargetMarketSelectorProps> = ({
  selectedMarkets,
  onToggle,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label>Target Markets (optional)</Label>
      <div className="flex flex-wrap gap-2">
        {markets.map((market) =>
        <button
          key={market}
          type="button"
          onClick={() => onToggle(market)}
          disabled={disabled}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          selectedMarkets.includes(market) ?
          "bg-primary text-white" :
          "bg-muted text-muted-foreground hover:bg-muted/80"} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          
            {market}
          </button>
        )}
      </div>
    </div>);

};

export default TargetMarketSelector;