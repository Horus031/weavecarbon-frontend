"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Store, Building2, Factory } from "lucide-react";

interface BusinessTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const businessTypes = [
  { value: "shop_online", label: "Online Shop", icon: Store },
  { value: "brand", label: "Brand", icon: Building2 },
  { value: "factory", label: "Factory", icon: Factory },
];

const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="space-y-2">
      <Label>Business Type *</Label>
      <div className="grid grid-cols-3 gap-3">
        {businessTypes.map(({ value: typeValue, label, icon: Icon }) => (
          <button
            key={typeValue}
            type="button"
            onClick={() => onChange(typeValue)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
              value === typeValue
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Icon
              className={`w-6 h-6 ${value === typeValue ? "text-primary" : "text-muted-foreground"}`}
            />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BusinessTypeSelector;
