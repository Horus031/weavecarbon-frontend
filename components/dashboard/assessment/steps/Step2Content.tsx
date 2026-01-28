"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductData } from "../StepContent";

interface Step2ContentProps {
  productData: ProductData;
  updateField: (field: keyof ProductData, value: string | string[]) => void;
  materials: Array<{ value: string; label: string }>;
  certifications: Array<{ value: string; label: string }>;
}

export default function Step2Content({
  productData,
  updateField,
  materials,
  certifications,
}: Step2ContentProps) {
  const handleCertificationToggle = (certValue: string) => {
    const current = productData.certifications;
    if (current.includes(certValue)) {
      updateField(
        "certifications",
        current.filter((c: string) => c !== certValue),
      );
    } else {
      updateField("certifications", [...current, certValue]);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Primary Material */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="primaryMaterial">Primary Material *</Label>
          <Select
            value={productData.primaryMaterial}
            onValueChange={(v) => updateField("primaryMaterial", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  {mat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="materialPercentage">Percentage (%) *</Label>
          <Input
            id="materialPercentage"
            type="number"
            min="0"
            max="100"
            value={productData.materialPercentage}
            onChange={(e) => updateField("materialPercentage", e.target.value)}
            placeholder="80"
          />
        </div>
      </div>

      {/* Secondary Material */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="secondaryMaterial">
            Secondary Material (Optional)
          </Label>
          <Select
            value={productData.secondaryMaterial || "none"}
            onValueChange={(v) =>
              updateField("secondaryMaterial", v === "none" ? "" : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {materials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  {mat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryPercentage">Percentage (%)</Label>
          <Input
            id="secondaryPercentage"
            type="number"
            min="0"
            max="100"
            value={productData.secondaryPercentage}
            onChange={(e) => updateField("secondaryPercentage", e.target.value)}
            placeholder="20"
            disabled={!productData.secondaryMaterial}
          />
        </div>
      </div>

      {/* Recycled Content */}
      <div className="space-y-2">
        <Label htmlFor="recycledContent">Recycled Content (%)</Label>
        <Input
          id="recycledContent"
          type="number"
          min="0"
          max="100"
          value={productData.recycledContent}
          onChange={(e) => updateField("recycledContent", e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <Label>Certifications (if any)</Label>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <Badge
              key={cert.value}
              variant={
                productData.certifications.includes(cert.value)
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => handleCertificationToggle(cert.value)}
            >
              {cert.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
