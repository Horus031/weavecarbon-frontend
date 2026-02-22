"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Globe,
  Ship,
  MapPin,
  Clock,
  CheckCircle2,
  QrCode,
  XCircle } from
"lucide-react";
import SupplyChainMap, {
  SupplyChainNode,
  SupplyChainRoute } from
"./SupplyChainMap";
import ShipmentMiniMap from "./ShipmentMiniMap";
import type { TransportLeg } from "@/types/transport";
import ProductQRCode from "../ProductQRCode";
import ShipmentDetails from "../track-shipment/ShipmentDetails";
import type { TrackShipment } from "../track-shipment/types";
import {
  fetchAllLogisticsShipments,
  fetchLogisticsShipmentById,
  formatShipmentLocation,
  inferShipmentProgress,
  isValidUuid,
  toTrackShipmentStatus,
  toTransportLegs,
  type LogisticsShipmentSummary,
  type LogisticsShipmentDetail } from
"@/lib/logisticsApi";


interface Shipment {
  shipmentId: string;
  id: string;
  productId: string;
  productName: string;
  sku: string;
  status: "in_transit" | "delivered" | "pending" | "cancelled";
  progress: number;
  origin: string;
  destination: string;
  estimatedArrival: string;
  createdAt: string;
  currentLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  legs: TransportLeg[];
  totalCO2: number;
  carrier: string;
}

const normalizeDateOnly = (value: string | null | undefined) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

const deriveDepartureDate = (createdAt: string | null | undefined) =>
normalizeDateOnly(createdAt);

const buildContainerNo = (referenceNumber: string, fallbackId: string) => {
  const normalizedReference = referenceNumber.replace(/[^a-zA-Z0-9]/g, "");
  if (normalizedReference) {
    return `WC-${normalizedReference.slice(-10).toUpperCase()}`;
  }
  return `WC-${fallbackId.slice(0, 8).toUpperCase()}`;
};

const toShipmentDetailLike = (
shipment: LogisticsShipmentSummary | LogisticsShipmentDetail)
: LogisticsShipmentDetail => {
  if ("legs" in shipment && "products" in shipment) {
    return shipment;
  }
  return {
    ...shipment,
    company_id: "",
    legs: [],
    products: []
  };
};

const mapShipmentToOverview = (
shipment: LogisticsShipmentSummary | LogisticsShipmentDetail)
: Shipment => {
  const detailLike = toShipmentDetailLike(shipment);
  const firstProduct = detailLike.products[0];
  const status = toTrackShipmentStatus(detailLike.status);
  const progress =
  detailLike.status === "cancelled" ? 0 : inferShipmentProgress(detailLike);
  const legs = toTransportLegs(detailLike);
  const originLabel = formatShipmentLocation(detailLike.origin);
  const destinationLabel = formatShipmentLocation(detailLike.destination);
  const currentPoint =
  status === "delivered" ?
  legs[legs.length - 1]?.destination || legs[0]?.destination :
  legs[0]?.origin;

  const fallbackLocation = currentPoint || {
    lat: 10.8231,
    lng: 106.6297,
    name: originLabel
  };

  return {
    shipmentId: detailLike.id,
    id: detailLike.reference_number || detailLike.id,
    productId: firstProduct?.product_id || detailLike.id,
    productName:
    firstProduct?.product_name || detailLike.reference_number || "Shipment",
    sku: firstProduct?.sku || detailLike.reference_number || detailLike.id,
    status,
    progress,
    origin: originLabel,
    destination: destinationLabel,
    estimatedArrival: normalizeDateOnly(
      detailLike.actual_arrival || detailLike.estimated_arrival || detailLike.updated_at
    ),
    createdAt: normalizeDateOnly(detailLike.created_at),
    currentLocation: {
      lat: fallbackLocation.lat,
      lng: fallbackLocation.lng,
      name: fallbackLocation.name
    },
    legs,
    totalCO2: detailLike.total_co2e,
    carrier:
    detailLike.legs.find((leg) => leg.carrier_name.trim().length > 0)?.carrier_name ||
    "Unknown carrier"
  };
};

const toDetailShipment = (shipment: Shipment): TrackShipment => ({
  id: shipment.id,
  shipmentId: shipment.shipmentId,
  productId: shipment.productId,
  productName: shipment.productName,
  sku: shipment.sku,
  status: shipment.status,
  progress: shipment.progress,
  origin: shipment.origin,
  destination: shipment.destination,
  estimatedArrival: shipment.estimatedArrival,
  departureDate: deriveDepartureDate(shipment.createdAt),
  currentLocation: shipment.currentLocation?.name || shipment.origin,
  legs: shipment.legs,
  totalCO2: shipment.totalCO2,
  carrier: shipment.carrier,
  containerNo: buildContainerNo(shipment.id, shipment.id)
});

const STATUS_PALETTE: Record<
  Shipment["status"],
  {
    badge: string;
    statCard: string;
    statValue: string;
    filterActive: string;
    cardAccent: string;
    headerTone: string;
  }> =
{
  in_transit: {
    badge:
    "border border-sky-300 bg-sky-100 text-sky-800",
    statCard: "border-sky-300 bg-sky-100/75",
    statValue: "text-sky-700",
    filterActive: "border-sky-400 bg-sky-100 text-sky-800 hover:bg-sky-200",
    cardAccent: "border-t-sky-400",
    headerTone: "bg-sky-100/60"
  },
  delivered: {
    badge:
    "border border-emerald-300 bg-emerald-100 text-emerald-800",
    statCard: "border-emerald-300 bg-emerald-100/75",
    statValue: "text-emerald-700",
    filterActive:
    "border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    cardAccent: "border-t-emerald-400",
    headerTone: "bg-emerald-100/60"
  },
  pending: {
    badge:
    "border border-amber-300 bg-amber-100 text-amber-800",
    statCard: "border-amber-300 bg-amber-100/75",
    statValue: "text-amber-700",
    filterActive: "border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200",
    cardAccent: "border-t-amber-400",
    headerTone: "bg-amber-100/60"
  },
  cancelled: {
    badge:
    "border border-rose-300 bg-rose-100 text-rose-800",
    statCard: "border-rose-300 bg-rose-100/75",
    statValue: "text-rose-700",
    filterActive: "border-rose-400 bg-rose-100 text-rose-800 hover:bg-rose-200",
    cardAccent: "border-t-rose-400",
    headerTone: "bg-rose-100/60"
  }
};

const ShippingOverviewMap: React.FC = () => {
  const t = useTranslations("logistics");
  const tTrack = useTranslations("trackShipment");
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailShipment, setDetailShipment] = useState<TrackShipment | null>(null);
  const [qrShipment, setQrShipment] = useState<Shipment | null>(null);
  const detailRequestSeqRef = useRef(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "in_transit" | "pending" | "delivered" | "cancelled">(
    "all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const openDetails = async (shipment: Shipment) => {
    const requestSeq = detailRequestSeqRef.current + 1;
    detailRequestSeqRef.current = requestSeq;
    setDetailShipment(toDetailShipment(shipment));

    if (!isValidUuid(shipment.shipmentId)) {
      return;
    }

    try {
      const detail = await fetchLogisticsShipmentById(shipment.shipmentId);
      if (requestSeq !== detailRequestSeqRef.current) {
        return;
      }
      setDetailShipment(toDetailShipment(mapShipmentToOverview(detail)));
    } catch {

    }
  };


  useEffect(() => {
    const loadUserShipments = async () => {
      setIsLoading(true);
      try {
        const shipmentSummaries = await fetchAllLogisticsShipments();
        const userShipments = shipmentSummaries.map((shipment) =>
        mapShipmentToOverview(shipment)
        );
        setAllShipments(userShipments);
      } catch {
        setAllShipments([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUserShipments();
  }, []);

  const getStatusBadge = (status: Shipment["status"]) => {
    const palette = STATUS_PALETTE[status];
    switch (status) {
      case "delivered":
        return (
          <Badge className={palette.badge}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("statuses.delivered")}
          </Badge>);

      case "in_transit":
        return (
          <Badge className={palette.badge}>
            <Ship className="w-3 h-3 mr-1" />
            {t("statuses.inTransit")}
          </Badge>);

      case "pending":
        return (
          <Badge className={palette.badge}>
            <Clock className="w-3 h-3 mr-1" />
            {t("statuses.pending")}
          </Badge>);

      case "cancelled":
        return (
          <Badge className={palette.badge}>
            <XCircle className="w-3 h-3 mr-1" />
            {t("statuses.cancelled")}
          </Badge>);

      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  const stats = useMemo(
    () => ({
      total: allShipments.length,
      inTransit: allShipments.filter((s) => s.status === "in_transit").length,
      delivered: allShipments.filter((s) => s.status === "delivered").length,
      pending: allShipments.filter((s) => s.status === "pending").length,
      cancelled: allShipments.filter((s) => s.status === "cancelled").length,
      totalCO2: allShipments.reduce((sum, s) => sum + s.totalCO2, 0)
    }),
    [allShipments]
  );

  const filteredShipments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allShipments.filter((shipment) => {
      if (statusFilter !== "all" && shipment.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
      shipment.productName,
      shipment.sku,
      shipment.id,
      shipment.origin,
      shipment.destination,
      shipment.productId,
      shipment.carrier].

      filter(Boolean).
      some((value) => value.toLowerCase().includes(query));
    });
  }, [allShipments, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredShipments.length / ITEMS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedShipments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShipments, safeCurrentPage]);


  const allNodes = useMemo((): SupplyChainNode[] => {
    const nodes: SupplyChainNode[] = [];
    const addedLocations = new Set<string>();

    paginatedShipments.forEach((shipment) => {
      shipment.legs.forEach((leg, legIndex) => {
        const originKey = `${leg.origin.lat.toFixed(2)}-${leg.origin.lng.toFixed(2)}`;
        if (!addedLocations.has(originKey)) {
          addedLocations.add(originKey);
          nodes.push({
            id: `${shipment.id}-${leg.id}-origin`,
            name: leg.origin.name,
            lat: leg.origin.lat,
            lng: leg.origin.lng,
            type:
            leg.origin.type === "port" ?
            "port" :
            leg.origin.type === "airport" ?
            "airport" :
            "factory",
            country: "Vietnam",
            co2: shipment.totalCO2,
            status:
            shipment.status === "delivered" ?
            "completed" :
            shipment.status === "pending" || shipment.status === "cancelled" ?
            "pending" :
            "active"
          });
        }

        if (legIndex === shipment.legs.length - 1) {
          const destKey = `${leg.destination.lat.toFixed(2)}-${leg.destination.lng.toFixed(2)}`;
          if (!addedLocations.has(destKey)) {
            addedLocations.add(destKey);
            nodes.push({
              id: `${shipment.id}-${leg.id}-dest`,
              name: leg.destination.name,
              lat: leg.destination.lat,
              lng: leg.destination.lng,
              type: "destination",
              country: shipment.destination.split(", ").pop() || "International",
              status:
              shipment.status === "delivered" ?
              "completed" :
              "pending"
            });
          }
        }
      });
    });

    return nodes;
  }, [paginatedShipments]);

  const allRoutes = useMemo(
    (): SupplyChainRoute[] =>
    paginatedShipments.flatMap((shipment) =>
    shipment.legs.map((leg) => ({
      id: `${shipment.id}-${leg.id}`,
      from: {
        lat: leg.origin.lat,
        lng: leg.origin.lng,
        name: leg.origin.name
      },
      to: {
        lat: leg.destination.lat,
        lng: leg.destination.lng,
        name: leg.destination.name
      },
      mode:
      leg.mode === "ship" ?
      "ship" as const :
      leg.mode === "air" ?
      "air" as const :
      "truck" as const,
      status:
      shipment.status === "delivered" ?
      "completed" as const :
      shipment.status === "pending" || shipment.status === "cancelled" ?
      "pending" as const :
      "in_transit" as const,
      co2Kg: leg.co2Kg,
      distanceKm: leg.distanceKm
    }))
    ),
    [paginatedShipments]
  );

  const filterButtonClass = (
  filter: "all" | "in_transit" | "pending" | "delivered" | "cancelled") =>
  {
    const base =
    "border h-9 px-3 text-sm font-medium transition-colors";
    if (statusFilter !== filter) {
      return `${base} border-slate-300 bg-white text-slate-800 hover:bg-slate-100`;
    }
    if (filter === "all") {
      return `${base} border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300`;
    }
    return `${base} ${STATUS_PALETTE[filter].filterActive}`;
  };

  const shipmentCardClass = (status: Shipment["status"]) =>
  `group cursor-pointer overflow-hidden border border-slate-300 bg-white shadow transition-all hover:border-slate-400 hover:shadow-lg border-t-2 ${STATUS_PALETTE[status].cardAccent}`;

  const shipmentHeaderClass = (status: Shipment["status"]) =>
  `border-b border-slate-300/90 pb-2 ${STATUS_PALETTE[status].headerTone}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) =>
          <div
            key={`shipment-loading-${index}`}
            className="h-20 rounded-lg border border-slate-200 bg-slate-100/70 animate-pulse" />

          )}
        </div>
        <div className="h-72 rounded-lg border border-slate-200 bg-slate-100/70 animate-pulse" />
      </div>);

  }


  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border border-slate-300 bg-white shadow">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-600">{t("statuses.totalShipments")}</p>
          </CardContent>
        </Card>
        <Card className={`border shadow ${STATUS_PALETTE.in_transit.statCard}`}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${STATUS_PALETTE.in_transit.statValue}`}>
              {stats.inTransit}
            </p>
            <p className="text-xs text-slate-600">{t("statuses.inTransit")}</p>
          </CardContent>
        </Card>
        <Card className={`border shadow ${STATUS_PALETTE.delivered.statCard}`}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${STATUS_PALETTE.delivered.statValue}`}>
              {stats.delivered}
            </p>
            <p className="text-xs text-slate-600">{t("statuses.delivered")}</p>
          </CardContent>
        </Card>
        <Card className={`border shadow ${STATUS_PALETTE.pending.statCard}`}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${STATUS_PALETTE.pending.statValue}`}>
              {stats.pending}
            </p>
            <p className="text-xs text-slate-600">{t("statuses.pending")}</p>
          </CardContent>
        </Card>
        <Card className={`border shadow ${STATUS_PALETTE.cancelled.statCard}`}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${STATUS_PALETTE.cancelled.statValue}`}>
              {stats.cancelled}
            </p>
            <p className="text-xs text-slate-600">{t("statuses.cancelled")}</p>
          </CardContent>
        </Card>
        <Card className="border border-orange-300 bg-orange-100/70 shadow">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-700">
              {stats.totalCO2.toFixed(0)}
            </p>
            <p className="text-xs text-slate-600">{t("statuses.totalCO2")}</p>
          </CardContent>
        </Card>
      </div>

      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={tTrack("searchPlaceholder")}
            className="h-10 min-w-0 flex-1 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-primary/30" />

          <div className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Button
              size="sm"
              variant="outline"
              className={filterButtonClass("all")}
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}>

              {tTrack("filterAll")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={filterButtonClass("in_transit")}
              onClick={() => {
                setStatusFilter("in_transit");
                setCurrentPage(1);
              }}>

              {tTrack("filterInTransit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={filterButtonClass("pending")}
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}>

              {tTrack("filterPending")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={filterButtonClass("delivered")}
              onClick={() => {
                setStatusFilter("delivered");
                setCurrentPage(1);
              }}>

              {tTrack("filterDelivered")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={filterButtonClass("cancelled")}
              onClick={() => {
                setStatusFilter("cancelled");
                setCurrentPage(1);
              }}>

              {tTrack("filterCancelled")}
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedShipments.map((shipment) =>
          <Card
            key={shipment.id}
            className={shipmentCardClass(shipment.status)}
            onClick={() => {
              void openDetails(shipment);
            }}>

              <CardHeader className={shipmentHeaderClass(shipment.status)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {shipment.productName}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {shipment.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(shipment.status)}
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrShipment(shipment);
                    }}
                    title={t("qrCodeTitle")}>
                    
                      <QrCode className="w-4 h-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                
                <div className="mt-1 overflow-hidden rounded-md border border-slate-300">
                  <ShipmentMiniMap
                  currentLocation={shipment.currentLocation}
                  height="120px"
                  status={shipment.status} />

                </div>

                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5">
                    <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                    <span
                    className="truncate"
                    title={`${shipment.origin} -> ${shipment.destination}`}>

                      <span className="text-emerald-700">{shipment.origin}</span>
                      <span className="text-slate-500">{" -> "}</span>
                      <span className="text-rose-700">{shipment.destination}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-300 pt-2">
                    <span className="text-xs font-medium text-slate-700">
                      {shipment.totalCO2.toFixed(1)} kg CO2e
                    </span>
                    <span className="text-xs text-slate-500">
                      {shipment.carrier}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {paginatedShipments.length === 0 &&
          <Card className="md:col-span-2 xl:col-span-3 border border-slate-300 bg-slate-50/60 shadow">
              <CardContent className="py-6 text-center">
                <p className="text-sm font-medium text-slate-800">
                  {allShipments.length === 0 ?
                "Chưa có lô hàng nào" :
                "Không có lô hàng phù hợp với bộ lọc hiện tại"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {allShipments.length === 0 ?
                "Hãy tạo và xuất bản lô hàng để dữ liệu hiển thị tại đây." :
                "Hãy thử đổi từ khóa tìm kiếm hoặc trạng thái."}
                </p>
              </CardContent>
            </Card>
          }
        </div>
        {filteredShipments.length > 0 && totalPages > 1 &&
        <div className="flex items-center justify-center gap-2">
              <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}>

                {t("pagination.prev")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("pagination.page", {
              current: safeCurrentPage,
              total: totalPages
            })}
              </span>
              <Button
            variant="outline"
            size="sm"
            onClick={() =>
            setCurrentPage((prev) =>
            Math.min(totalPages, Math.max(1, prev) + 1)
            )
            }
            disabled={safeCurrentPage === totalPages}>

                {t("pagination.next")}
              </Button>
          </div>
        }
      </div>

      
      <Card className="overflow-hidden border border-slate-300 shadow">
        <CardHeader className="border-b border-slate-300 bg-slate-100/70 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            {t("mapTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <SupplyChainMap
            nodes={allNodes}
            routes={allRoutes}
            center={[20, 80]}
            zoom={2}
            height="520px"
            defaultMapMode="2d"
            showModeToggle={false} />
          
        </CardContent>
      </Card>

      <Dialog
        open={!!detailShipment}
        onOpenChange={(open) => {
          if (!open) setDetailShipment(null);
        }}>

        {detailShipment &&
        <DialogContent className="max-w-[68rem] w-[96vw] max-h-[90vh] overflow-y-auto overflow-x-hidden [&>button]:top-2 [&>button]:right-2">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {t("routeDetails")}: {detailShipment.productName}
              </DialogTitle>
            </DialogHeader>
            <ShipmentDetails shipment={detailShipment} />
          </DialogContent>
        }
      </Dialog>

      
      {qrShipment &&
      <ProductQRCode
        productId={qrShipment.productId}
        productName={qrShipment.productName}
        sku={qrShipment.sku}
        isOpen={!!qrShipment}
        onClose={() => setQrShipment(null)} />

      }
    </div>);

};

export default ShippingOverviewMap;