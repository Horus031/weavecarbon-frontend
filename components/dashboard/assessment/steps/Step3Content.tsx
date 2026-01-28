"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductData } from "../StepContent";

interface Step3ContentProps {
  productData: ProductData;
  updateField: (field: keyof ProductData, value: string | string[]) => void;
  energySources: Array<{ value: string; label: string }>;
}

export default function Step3Content({
  productData,
  updateField,
  energySources,
}: Step3ContentProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Manufacturing Location */}
      <div className="space-y-2">
        <Label htmlFor="manufacturingLocation">Manufacturing Location</Label>
        <Input
          id="manufacturingLocation"
          value={productData.manufacturingLocation}
          onChange={(e) => updateField("manufacturingLocation", e.target.value)}
          placeholder="e.g., Vietnam"
        />
      </div>

      {/* Energy Source */}
      <div className="space-y-2">
        <Label htmlFor="energySource">Primary Energy Source *</Label>
        <Select
          value={productData.energySource}
          onValueChange={(v) => updateField("energySource", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select energy source" />
          </SelectTrigger>
          <SelectContent>
            {energySources.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Process Type */}
      <div className="space-y-2">
        <Label htmlFor="processType">Manufacturing Process *</Label>
        <Select
          value={productData.processType}
          onValueChange={(v) => updateField("processType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select process type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spinning">Spinning</SelectItem>
            <SelectItem value="weaving">Weaving</SelectItem>
            <SelectItem value="dyeing">Dyeing</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="cutting">Cutting & Sewing</SelectItem>
            <SelectItem value="finishing">Finishing</SelectItem>
            <SelectItem value="mixed">Mixed Processes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Waste Recovery */}
      <div className="space-y-2">
        <Label htmlFor="wasteRecovery">Waste Recovery/Recycling</Label>
        <Input
          id="wasteRecovery"
          type="number"
          min="0"
          max="100"
          value={productData.wasteRecovery}
          onChange={(e) => updateField("wasteRecovery", e.target.value)}
          placeholder="0"
          className="mb-1"
        />
        <p className="text-xs text-muted-foreground">
          Percentage of manufacturing waste recovered or recycled
        </p>
      </div>
    </div>
  );
}
