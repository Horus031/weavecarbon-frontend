"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { useEffect } from "react";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import { DEMO_SHIPMENTS } from "@/lib/trackShipmentData";

const TrackShipmentClient: React.FC = () => {
  const { setPageTitle } = useDashboardTitle();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<
    (typeof DEMO_SHIPMENTS)[0] | null
  >(DEMO_SHIPMENTS[0]);

  useEffect(() => {
    setPageTitle(
      "Theo dõi lô hàng",
      "Xem trạng thái và vị trí của tất cả lô hàng",
    );
  }, [setPageTitle]);

  const filteredShipments = DEMO_SHIPMENTS.filter((shipment) => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.containerNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Theo dõi lô hàng</h2>
          <p className="text-muted-foreground">
            Xem trạng thái và vị trí của tất cả lô hàng
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <ShipmentList
          shipments={filteredShipments}
          selectedShipment={selectedShipment}
          onSelectShipment={setSelectedShipment}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <ShipmentDetails shipment={selectedShipment} />
      </div>
    </div>
  );
};

export default TrackShipmentClient;
