"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import type { TrackShipment } from "./types";
import {
  fetchAllLogisticsShipmentDetails,
  formatShipmentLocation,
  inferShipmentProgress,
  toTrackShipmentStatus,
  toTransportLegs,
  type LogisticsShipmentDetail } from
"@/lib/logisticsApi";

const normalizeDateOnly = (value: string | null | undefined) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

const buildContainerNo = (referenceNumber: string, fallbackId: string) => {
  const normalizedReference = referenceNumber.replace(/[^a-zA-Z0-9]/g, "");
  if (normalizedReference) {
    return `CNT-${normalizedReference.slice(-10).toUpperCase()}`;
  }
  return `CNT-${fallbackId.slice(0, 8).toUpperCase()}`;
};

const mapShipmentToTrackShipment = (
shipment: LogisticsShipmentDetail)
: TrackShipment => {
  const firstProduct = shipment.products[0];
  const originLabel = formatShipmentLocation(shipment.origin);
  const destinationLabel = formatShipmentLocation(shipment.destination);
  const progress =
  shipment.status === "cancelled" ? 0 : inferShipmentProgress(shipment);
  const status = toTrackShipmentStatus(shipment.status);
  const carrier =
  shipment.legs.find((leg) => leg.carrier_name.trim().length > 0)?.carrier_name ||
  "Unknown carrier";

  const estimatedArrival =
  normalizeDateOnly(shipment.actual_arrival || shipment.estimated_arrival) ||
  normalizeDateOnly(shipment.updated_at);

  return {
    id: shipment.reference_number || shipment.id,
    shipmentId: shipment.id,
    productId: firstProduct?.product_id || null,
    productName: firstProduct?.product_name || shipment.reference_number || "Shipment",
    sku: firstProduct?.sku || shipment.reference_number || shipment.id,
    status,
    progress,
    origin: originLabel,
    destination: destinationLabel,
    estimatedArrival,
    departureDate: normalizeDateOnly(shipment.created_at),
    currentLocation: status === "delivered" ? destinationLabel : originLabel,
    legs: toTransportLegs(shipment),
    totalCO2: shipment.total_co2e,
    carrier,
    containerNo: buildContainerNo(shipment.reference_number, shipment.id)
  };
};

const TrackShipmentClient: React.FC = () => {
  const t = useTranslations("trackShipment");
  const searchParams = useSearchParams();
  const { setPageTitle } = useDashboardTitle();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [allShipments, setAllShipments] = useState<TrackShipment[]>([]);
  const [selectedShipment, setSelectedShipment] =
  useState<TrackShipment | null>(null);
  const preferredShipmentId = searchParams.get("shipmentId");

  useEffect(() => {
    setPageTitle(
      t("title"),
      t("subtitle")
    );
  }, [setPageTitle, t]);

  const loadShipments = useCallback(async (preferredId?: string | null) => {
    try {
      const shipmentDetails = await fetchAllLogisticsShipmentDetails();
      const nextShipments = shipmentDetails.map((shipment) =>
      mapShipmentToTrackShipment(shipment)
      );

      setAllShipments(nextShipments);
      setSelectedShipment((prev) => {
        const targetId = preferredId || prev?.id;
        if (targetId) {
          const matched = nextShipments.find((shipment) => shipment.id === targetId);
          if (matched) return matched;
        }
        return nextShipments[0] || null;
      });
    } catch {
      setAllShipments([]);
      setSelectedShipment(null);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadShipments(preferredShipmentId);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadShipments, preferredShipmentId]);

  const filteredShipments = allShipments.filter((shipment) => {
    const matchesSearch =
    shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.containerNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
    statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    void loadShipments(selectedShipment?.id);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <ShipmentList
          shipments={filteredShipments}
          selectedShipment={selectedShipment}
          onSelectShipment={setSelectedShipment}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter} />


        <ShipmentDetails shipment={selectedShipment} onRefresh={handleRefresh} />
      </div>
    </div>);

};

export default TrackShipmentClient;