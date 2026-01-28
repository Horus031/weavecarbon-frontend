"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ProductData } from "../StepContent";

interface Step5ContentProps {
  productData: ProductData;
  markets: Array<{ value: string; label: string }>;
  transportModes: Array<{ value: string; label: string }>;
}

export default function Step5Content({
  productData,
  markets,
  transportModes,
}: Step5ContentProps) {
  const getMarketLabel = (value: string) => {
    return markets.find((m) => m.value === value)?.label || value;
  };

  const getTransportLabel = (value: string) => {
    return transportModes.find((t) => t.value === value)?.label || value;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="font-semibold text-green-900 dark:text-green-100">
            All information provided
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Ready to calculate carbon footprint
          </p>
        </div>
      </div>

      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Product Name</p>
              <p className="font-medium capitalize">
                {productData.productName || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SKU Code</p>
              <p className="font-medium capitalize">
                {productData.productCode || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="font-medium capitalize">
                {productData.weight} {productData.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="font-medium capitalize truncate">
                {productData.description || "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Materials Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Primary Material</p>
              <p className="font-medium capitalize">
                {productData.primaryMaterial} ({productData.materialPercentage}
                %)
              </p>
            </div>
            {productData.secondaryMaterial && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Secondary Material
                </p>
                <p className="font-medium capitalize">
                  {productData.secondaryMaterial} (
                  {productData.secondaryPercentage}%)
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Recycled Content</p>
              <p className="font-medium capitalize">{productData.recycledContent}%</p>
            </div>
            {productData.certifications.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-1">
                  {productData.certifications.map((cert: string) => (
                    <Badge key={cert} variant="secondary" className="text-xs">
                      {cert.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Manufacturing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium capitalize">{productData.manufacturingLocation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Energy Source</p>
              <p className="font-medium capitalize">{productData.energySource}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Process Type</p>
              <p className="font-medium capitalize">{productData.processType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Waste Recovery</p>
              <p className="font-medium capitalize">{productData.wasteRecovery || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Logistics & Shipping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Origin</p>
              <p className="font-medium capitalize">{productData.originCountry}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-medium capitalize">
                {getMarketLabel(productData.destinationMarket)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transport Mode</p>
              <p className="font-medium capitalize">
                {getTransportLabel(productData.transportMode)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Packaging Type</p>
              <p className="font-medium capitalize">{productData.packagingType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Packaging Weight</p>
              <p className="font-medium capitalize">{productData.packagingWeight} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300">
          Click &quot;View Results&quot; to proceed with carbon calculation and
          export compliance assessment
        </p>
      </div>
    </div>
  );
}
