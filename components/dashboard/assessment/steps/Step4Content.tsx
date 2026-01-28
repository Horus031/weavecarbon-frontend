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

interface Step4ContentProps {
  productData: ProductData;
  updateField: (field: keyof ProductData, value: string | string[]) => void;
  transportModes: Array<{ value: string; label: string }>;
  markets: Array<{ value: string; label: string }>;
}

export default function Step4Content({
  productData,
  updateField,
  transportModes,
  markets,
}: Step4ContentProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Origin Country */}
      <div className="space-y-2">
        <Label htmlFor="originCountry">Origin Country</Label>
        <Input
          id="originCountry"
          value={productData.originCountry}
          onChange={(e) => updateField("originCountry", e.target.value)}
          placeholder="e.g., Vietnam"
        />
      </div>

      {/* Destination Market */}
      <div className="space-y-2">
        <Label htmlFor="destinationMarket">Destination Market *</Label>
        <Select
          value={productData.destinationMarket}
          onValueChange={(v) => updateField("destinationMarket", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination market" />
          </SelectTrigger>
          <SelectContent>
            {markets.map((market) => (
              <SelectItem key={market.value} value={market.value}>
                {market.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transport Mode */}
      <div className="space-y-2">
        <Label htmlFor="transportMode">Primary Transport Mode *</Label>
        <Select
          value={productData.transportMode}
          onValueChange={(v) => updateField("transportMode", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transport mode" />
          </SelectTrigger>
          <SelectContent>
            {transportModes.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Packaging Type */}
      <div className="space-y-2">
        <Label htmlFor="packagingType">Packaging Type</Label>
        <Select
          value={productData.packagingType}
          onValueChange={(v) => updateField("packagingType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select packaging type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plastic">Plastic</SelectItem>
            <SelectItem value="paper">Paper/Cardboard</SelectItem>
            <SelectItem value="biodegradable">Biodegradable</SelectItem>
            <SelectItem value="reusable">Reusable</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Packaging Weight */}
      <div className="space-y-2">
        <Label htmlFor="packagingWeight">Packaging Weight (kg)</Label>
        <Input
          id="packagingWeight"
          type="number"
          step="0.01"
          value={productData.packagingWeight}
          onChange={(e) => updateField("packagingWeight", e.target.value)}
          placeholder="0.5"
        />
      </div>
    </div>
  );
}
