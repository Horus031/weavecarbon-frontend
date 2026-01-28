"use client";
import { ProductData } from "../StepContent";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step1ContentProps {
  productData: ProductData;
  updateField: (field: keyof ProductData, value: string | string[]) => void;
  categories: Array<{ value: string; label: string }>;
}

export default function Step1Content({
  productData,
  updateField,
  categories,
}: Step1ContentProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            value={productData.productName}
            onChange={(e) => updateField("productName", e.target.value)}
            placeholder="e.g., Organic Cotton T-Shirt"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="productCode">SKU Code</Label>
          <Input
            id="productCode"
            value={productData.productCode}
            onChange={(e) => updateField("productCode", e.target.value)}
            placeholder="e.g., SKU-2024-001"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Category *</Label>
        <Select
          value={productData.category}
          onValueChange={(v) => updateField("category", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Product Description</Label>
        <Textarea
          id="description"
          value={productData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Brief description of the product..."
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="weight">Product Weight *</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={productData.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            placeholder="0.5"
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={productData.unit}
            onValueChange={(v) => updateField("unit", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="g">Gram (g)</SelectItem>
              <SelectItem value="lb">Pound (lb)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
