"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw } from
"lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import TransportScopeSelector from "./TransportScopeSelector";
import TransportLegCard from "./TransportLegCard";
import TransportResultsSidebar from "./TransportResultsSidebar";
import PermissionDialog from "@/components/ui/PermissionDialog";
import TransportMap from "@/components/ui/TransportMap";
import type { TransportLeg } from "@/types/transport";
import {
  fetchAllLogisticsShipmentDetails,
  fetchLogisticsShipmentById,
  fetchLogisticsShipments,
  isValidUuid,
  type LogisticsLocation,
  toTransportLegs,
  type LogisticsShipmentDetail } from
"@/lib/logisticsApi";
import { fetchProductById, type ProductRecord } from "@/lib/productsApi";

export interface AddressData {
  streetAddress: string;
  aptSuite: string;
  city: string;
  state: string;
  zipPostcode: string;
  country: string;
  lat?: string;
  lng?: string;
}

export interface LegInput {
  id: string;
  type: "domestic" | "international";
  mode: "truck_light" | "truck_heavy" | "ship" | "air" | "rail";
  origin: AddressData;
  destination: AddressData;
  distanceKm: string;
  co2Kg?: number;
}

type ShipmentLoadState = "idle" | "loading" | "ready" | "not_found" | "error";

const createEmptyAddress = (): AddressData => ({
  streetAddress: "",
  aptSuite: "",
  city: "",
  state: "",
  zipPostcode: "",
  country: "VN",
  lat: "",
  lng: ""
});

const createDraftLeg = (
type: LegInput["type"] = "international",
id = `draft-leg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`)
: LegInput => ({
  id,
  type,
  mode: type === "domestic" ? "truck_light" : "ship",
  origin: createEmptyAddress(),
  destination: createEmptyAddress(),
  distanceKm: ""
});

const createInitialLeg = () => createDraftLeg("international", "draft-leg-1");

const EMISSION_FACTORS: Record<string, number> = {
  truck_light: 0.089,
  truck_heavy: 0.105,
  ship: 0.016,
  air: 0.602,
  rail: 0.028
};

const parseCoordinate = (value?: string) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRouteType = (mode: LegInput["mode"]): TransportLeg["routeType"] => {
  if (mode === "ship") return "sea";
  if (mode === "air") return "air";
  return "road";
};

const addressToLabel = (address: AddressData) => {
  const parts = [address.city, address.state, address.country].
  map((part) => part.trim()).
  filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
};

const locationToAddress = (
location: TransportLeg["origin"] | TransportLeg["destination"])
: AddressData => {
  const parts = location.name.
  split(",").
  map((part) => part.trim()).
  filter(Boolean);

  const city = parts[0] || "";
  const country = parts.length > 1 ? parts[parts.length - 1] : "VN";

  return {
    ...createEmptyAddress(),
    city,
    country,
    lat: Number.isFinite(location.lat) ? String(location.lat) : "",
    lng: Number.isFinite(location.lng) ? String(location.lng) : ""
  };
};

const toLegInput = (leg: TransportLeg): LegInput => ({
  id: leg.id,
  type: leg.type,
  mode: leg.mode,
  origin: locationToAddress(leg.origin),
  destination: locationToAddress(leg.destination),
  distanceKm:
  leg.distanceKm > 0 ?
  String(Math.round((leg.distanceKm + Number.EPSILON) * 100) / 100) :
  "",
  co2Kg: leg.co2Kg
});

const mapProductTransportMode = (
mode: "road" | "sea" | "air" | "rail" | undefined)
: LegInput["mode"] => {
  if (mode === "sea") return "ship";
  if (mode === "air") return "air";
  if (mode === "rail") return "rail";
  return "truck_heavy";
};

const toProductAddress = (address?: ProductRecord["originAddress"]): AddressData => {
  const streetAddress = [address?.streetNumber, address?.street].
  map((value) => (value || "").trim()).
  filter(Boolean).
  join(" ");
  const aptSuite = [address?.ward, address?.district].
  map((value) => (value || "").trim()).
  filter(Boolean).
  join(", ");

  return {
    streetAddress,
    aptSuite,
    city: (address?.city || "").trim(),
    state: (address?.stateRegion || "").trim(),
    zipPostcode: (address?.postalCode || "").trim(),
    country: (address?.country || "VN").trim() || "VN",
    lat:
    typeof address?.lat === "number" && Number.isFinite(address.lat) ?
    String(address.lat) :
    "",
    lng:
    typeof address?.lng === "number" && Number.isFinite(address.lng) ?
    String(address.lng) :
    ""
  };
};

const toShipmentLocationAddress = (location: LogisticsLocation): AddressData => ({
  ...createEmptyAddress(),
  streetAddress: location.address.trim(),
  city: location.city.trim(),
  country: location.country.trim() || "VN",
  lat:
  typeof location.lat === "number" && Number.isFinite(location.lat) ?
  String(location.lat) :
  "",
  lng:
  typeof location.lng === "number" && Number.isFinite(location.lng) ?
  String(location.lng) :
  ""
});

const mergeAddressData = (
current: AddressData,
fallback: AddressData)
: AddressData => {
  const pick = (value: string | undefined, fallbackValue: string | undefined) => {
    const normalized = (value || "").trim();
    if (normalized.length > 0) return normalized;
    return (fallbackValue || "").trim();
  };

  return {
    streetAddress: pick(current.streetAddress, fallback.streetAddress),
    aptSuite: pick(current.aptSuite, fallback.aptSuite),
    city: pick(current.city, fallback.city),
    state: pick(current.state, fallback.state),
    zipPostcode: pick(current.zipPostcode, fallback.zipPostcode),
    country: pick(current.country, fallback.country) || "VN",
    lat: pick(current.lat, fallback.lat),
    lng: pick(current.lng, fallback.lng)
  };
};

const buildFallbackLegFromProduct = (product: ProductRecord): LegInput | null => {
  const origin = toProductAddress(product.originAddress);
  const destination = toProductAddress(product.destinationAddress);

  const hasUsefulOrigin =
  origin.city.trim().length > 0 ||
  origin.country.trim().length > 0 ||
  origin.lat?.trim().length !== 0;
  const hasUsefulDestination =
  destination.city.trim().length > 0 ||
  destination.country.trim().length > 0 ||
  destination.lat?.trim().length !== 0;

  if (!hasUsefulOrigin && !hasUsefulDestination) return null;

  const firstTransportLeg = product.transportLegs[0];
  const normalizedOriginCountry = origin.country.trim().toLowerCase();
  const normalizedDestinationCountry = destination.country.trim().toLowerCase();
  const type: LegInput["type"] =
  normalizedOriginCountry &&
  normalizedDestinationCountry &&
  normalizedOriginCountry === normalizedDestinationCountry ?
  "domestic" :
  "international";

  const distance =
  product.estimatedTotalDistance > 0 ?
  product.estimatedTotalDistance :
  firstTransportLeg?.estimatedDistance || 0;
  const transportCo2 = product.carbonResults?.perProduct.transport || undefined;

  return {
    id: `product-fallback-${product.id}`,
    type,
    mode: mapProductTransportMode(firstTransportLeg?.mode),
    origin,
    destination,
    distanceKm: distance > 0 ? String(distance) : "",
    co2Kg: transportCo2
  };
};

const hydrateLegInputsFromShipmentAndProduct = (
legs: LegInput[],
shipment: LogisticsShipmentDetail,
product: ProductRecord | null) =>
{
  if (!legs.length) return legs;

  const originFallback = mergeAddressData(
    toShipmentLocationAddress(shipment.origin),
    product ? toProductAddress(product.originAddress) : createEmptyAddress()
  );
  const destinationFallback = mergeAddressData(
    toShipmentLocationAddress(shipment.destination),
    product ? toProductAddress(product.destinationAddress) : createEmptyAddress()
  );

  return legs.map((leg, index) => {
    const isFirst = index === 0;
    const isLast = index === legs.length - 1;
    return {
      ...leg,
      origin: isFirst ? mergeAddressData(leg.origin, originFallback) : leg.origin,
      destination: isLast ?
      mergeAddressData(leg.destination, destinationFallback) :
      leg.destination
    };
  });
};

interface ShipmentLookupInput {
  shipmentId?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
}

const normalizeLookupValue = (value?: string | null) =>
(value || "").trim().toLowerCase();

const toLookupTokens = (values: Array<string | undefined>) => {
  const seen = new Set<string>();
  const tokens: string[] = [];
  values.forEach((value) => {
    const normalized = (value || "").trim();
    if (normalized.length < 2) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    tokens.push(normalized);
  });
  return tokens;
};

const shipmentMatchesLookup = (
shipment: LogisticsShipmentDetail,
lookup: ShipmentLookupInput) =>
{
  const targetProductId = normalizeLookupValue(lookup.productId);
  const targetSku = normalizeLookupValue(lookup.productCode);
  const targetName = normalizeLookupValue(lookup.productName);

  if (!targetProductId && !targetSku && !targetName) {
    return true;
  }

  const matchesProduct = shipment.products.some((product) => {
    const productId = normalizeLookupValue(product.product_id);
    const sku = normalizeLookupValue(product.sku);
    const name = normalizeLookupValue(product.product_name);

    if (targetProductId && productId === targetProductId) return true;
    if (targetSku && sku) {
      if (sku === targetSku || sku.includes(targetSku) || targetSku.includes(sku)) {
        return true;
      }
    }
    if (targetName && name && name.includes(targetName)) return true;
    return false;
  });

  if (matchesProduct) return true;

  const reference = normalizeLookupValue(shipment.reference_number);
  if (targetSku && reference && reference.includes(targetSku)) {
    return true;
  }

  return false;
};

const resolveShipmentForProduct = async (
lookup: ShipmentLookupInput,
prefetchedProduct?: ProductRecord | null)
: Promise<LogisticsShipmentDetail | null> => {
  const normalizedShipmentId = (lookup.shipmentId || "").trim();
  const normalizedProductId = (lookup.productId || "").trim();
  const inspectedIds = new Set<string>();
  let productDetail = prefetchedProduct || null;

  const inspectShipmentById = async (
  shipmentId: string,
  enforceMatch = true)
  : Promise<LogisticsShipmentDetail | null> => {
    const normalizedId = shipmentId.trim();
    if (!normalizedId || !isValidUuid(normalizedId) || inspectedIds.has(normalizedId)) {
      return null;
    }
    inspectedIds.add(normalizedId);

    try {
      const detail = await fetchLogisticsShipmentById(normalizedId);
      if (!enforceMatch || shipmentMatchesLookup(detail, lookup)) {
        return detail;
      }
    } catch {
      return null;
    }
    return null;
  };

  const directShipmentMatch = await inspectShipmentById(normalizedShipmentId, false);
  if (directShipmentMatch) return directShipmentMatch;

  if (normalizedProductId) {
    try {
      if (!productDetail) {
        productDetail = await fetchProductById(normalizedProductId);
      }
      const linkedShipmentId = (productDetail?.shipmentId || "").trim();
      const linkedShipment = await inspectShipmentById(linkedShipmentId, false);
      if (linkedShipment) return linkedShipment;
    } catch {

    }
  }

  const productAsShipment = await inspectShipmentById(normalizedProductId, true);
  if (productAsShipment) return productAsShipment;

  const candidateIds: string[] = [];
  const addCandidateId = (id: string) => {
    const normalizedId = id.trim();
    if (!normalizedId || !isValidUuid(normalizedId)) return;
    if (candidateIds.includes(normalizedId)) return;
    candidateIds.push(normalizedId);
  };

  const lookupTokens = toLookupTokens([
  normalizedProductId,
  lookup.productCode,
  lookup.productName]
  );

  for (const token of lookupTokens) {
    try {
      const result = await fetchLogisticsShipments({
        search: token,
        page: 1,
        page_size: 10
      });
      result.items.forEach((summary) => addCandidateId(summary.id));
    } catch {

    }
  }

  for (const candidateId of candidateIds) {
    const matched = await inspectShipmentById(candidateId, true);
    if (matched) return matched;
  }

  try {
    const recentShipments = await fetchLogisticsShipments({
      page: 1,
      page_size: 30
    });
    for (const summary of recentShipments.items) {
      const matched = await inspectShipmentById(summary.id, true);
      if (matched) return matched;
    }
  } catch {

  }

  try {
    const allShipmentDetails = await fetchAllLogisticsShipmentDetails();
    const matched = allShipmentDetails.find((shipment) =>
    shipmentMatchesLookup(shipment, lookup)
    );
    if (matched) return matched;
  } catch {

  }

  return null;
};

interface TransportClientProps {
  shipmentId?: string;
  productId?: string;
  productName?: string;
  productCode?: string;
}

const TransportClient: React.FC<TransportClientProps> = ({
  shipmentId,
  productId,
  productName,
  productCode
}) => {
  const t = useTranslations("transport");
  const router = useRouter();
  const { setPageTitle } = useDashboardTitle();
  const hasLookupInput = Boolean(shipmentId || productId || productCode || productName);
  const [transportScope, setTransportScope] = useState<
    "domestic" | "international">(
    "international");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [legs, setLegs] = useState<LegInput[]>([createInitialLeg()]);
  const [shipmentLoadState, setShipmentLoadState] = useState<ShipmentLoadState>(
    hasLookupInput ? "loading" : "idle"
  );
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    setPageTitle(
      t("title"),
      t("subtitle")
    );
  }, [setPageTitle, t]);

  useEffect(() => {
    let isCancelled = false;

    const hydrateFromShipment = async () => {
      if (!hasLookupInput) {
        if (isCancelled) return;
        setShipmentLoadState("idle");
        setShipmentError(null);
        setLegs([createInitialLeg()]);
        return;
      }

      setShipmentLoadState("loading");
      setShipmentError(null);

      try {
        let productDetail: ProductRecord | null = null;
        if (productId) {
          try {
            productDetail = await fetchProductById(productId);
          } catch {
            productDetail = null;
          }
        }

        const matchedShipment = await resolveShipmentForProduct({
          shipmentId,
          productId,
          productCode,
          productName
        }, productDetail);
        if (isCancelled) return;

        if (!matchedShipment) {
          const productFallbackLeg =
          productDetail ? buildFallbackLegFromProduct(productDetail) : null;
          if (productFallbackLeg) {
            setLegs([productFallbackLeg]);
            setTransportScope(productFallbackLeg.type === "international" ? "international" : "domestic");
            setShipmentLoadState("ready");
            return;
          }
          setShipmentLoadState("not_found");
          setLegs([createInitialLeg()]);
          return;
        }

        const hydratedLegs = hydrateLegInputsFromShipmentAndProduct(
          toTransportLegs(matchedShipment).map(toLegInput),
          matchedShipment,
          productDetail
        );
        if (!hydratedLegs.length) {
          const productFallbackLeg =
          productDetail ? buildFallbackLegFromProduct(productDetail) : null;
          if (productFallbackLeg) {
            setLegs([productFallbackLeg]);
            setTransportScope(productFallbackLeg.type === "international" ? "international" : "domestic");
            setShipmentLoadState("ready");
            return;
          }
          setShipmentLoadState("not_found");
          setLegs([createInitialLeg()]);
          return;
        }

        setLegs(hydratedLegs);
        setTransportScope(
          hydratedLegs.some((leg) => leg.type === "international") ?
          "international" :
          "domestic"
        );
        setShipmentLoadState("ready");
      } catch (error) {
        if (isCancelled) return;
        const message =
        error instanceof Error && error.message.trim().length > 0 ?
        error.message :
        "Khong the tai du lieu logistics.";
        setShipmentError(message);
        setShipmentLoadState("error");
        setLegs([createInitialLeg()]);
      }
    };

    void hydrateFromShipment();

    return () => {
      isCancelled = true;
    };
  }, [hasLookupInput, shipmentId, productId, productCode, productName, reloadCounter]);

  const handleAddLeg = () => {
    setLegs((current) => [...current, createDraftLeg(transportScope)]);
  };

  const handleRemoveLeg = (id: string) => {
    setLegs((current) =>
    current.length > 1 ? current.filter((leg) => leg.id !== id) : current
    );
  };

  const updateLeg = (
  id: string,
  field: keyof LegInput,
  value: string | AddressData) =>
  {
    setLegs((current) =>
    current.map((leg) => {
      if (leg.id !== id) return leg;
      return {
        ...leg,
        [field]: value,
        co2Kg: undefined
      };
    })
    );
  };

  const calculateLegCO2 = (leg: LegInput): number => {
    if (typeof leg.co2Kg === "number" && Number.isFinite(leg.co2Kg)) {
      return Math.max(0, leg.co2Kg);
    }
    const distance = parseFloat(leg.distanceKm) || 0;
    const factor = EMISSION_FACTORS[leg.mode] || 0;
    return distance * factor;
  };

  const totalDistance = useMemo(
    () =>
    legs.reduce(
      (sum, leg) => sum + (parseFloat(leg.distanceKm) || 0),
      0
    ),
    [legs]
  );

  const totalCO2 = useMemo(
    () => legs.reduce((sum, leg) => sum + calculateLegCO2(leg), 0),
    [legs]
  );

  const displayLegs = useMemo(
    () =>
    legs.
    map((leg, index) => {
      const originLat = parseCoordinate(leg.origin.lat);
      const originLng = parseCoordinate(leg.origin.lng);
      const destinationLat = parseCoordinate(leg.destination.lat);
      const destinationLng = parseCoordinate(leg.destination.lng);
      if (
      originLat === null ||
      originLng === null ||
      destinationLat === null ||
      destinationLng === null)
      {
        return null;
      }

      const distance = parseFloat(leg.distanceKm) || 0;
      const co2Kg = calculateLegCO2(leg);
      const emissionFactor =
      distance > 0 && co2Kg > 0 ?
      co2Kg / distance :
      EMISSION_FACTORS[leg.mode] || 0;

      return {
        id: leg.id,
        legNumber: index + 1,
        type: leg.type,
        mode: leg.mode,
        origin: {
          name: addressToLabel(leg.origin),
          lat: originLat,
          lng: originLng,
          type: "address"
        },
        destination: {
          name: addressToLabel(leg.destination),
          lat: destinationLat,
          lng: destinationLng,
          type: "address"
        },
        distanceKm: distance,
        emissionFactor,
        co2Kg,
        routeType: toRouteType(leg.mode)
      } as TransportLeg;
    }).
    filter((leg): leg is TransportLeg => leg !== null),
    [legs]
  );

  const handleSubmit = () => {
    if (productId) {
      router.push(`/calculation-history?productId=${encodeURIComponent(productId)}`);
      return;
    }
    router.push("/calculation-history");
  };

  const handleLocationPermission = async () => {
    setHasLocationPermission(true);
    setShowLocationDialog(false);
  };

  const isShipmentLoading = hasLookupInput && shipmentLoadState === "loading";
  const canRetryShipment =
  hasLookupInput && (
  shipmentLoadState === "error" || shipmentLoadState === "not_found");
  const mapSubject = useMemo(() => {
    const name = (productName || "").trim();
    const code = (productCode || "").trim();
    const shipment = (shipmentId || "").trim();
    const product = (productId || "").trim();

    if (name) return name;
    if (code) return code;
    if (shipment) return `shipment ${shipment.slice(0, 8)}`;
    if (product) return `sản phẩm ${product.slice(0, 8)}`;
    return undefined;
  }, [productName, productCode, shipmentId, productId]);
  const mapSubjectMeta = useMemo(() => {
    const name = (productName || "").trim();
    const code = (productCode || "").trim();
    if (name && code) return `SKU: ${code}`;
    return undefined;
  }, [productName, productCode]);

  return (
    <>
      <PermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        type="location"
        onAllow={handleLocationPermission}
        onDeny={() => setShowLocationDialog(false)} />


      <div className="space-y-6">
        {hasLookupInput && shipmentLoadState !== "ready" && shipmentLoadState !== "idle" &&
        <Card>
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                {shipmentLoadState === "loading" &&
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Dang tai du lieu logistics...
                  </p>
              }

                {shipmentLoadState === "not_found" &&
              <p className="text-xs text-amber-700 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Khong tim thay shipment phu hop voi du lieu dang mo.
                  </p>
              }

                {shipmentLoadState === "error" &&
              <p className="text-xs text-destructive inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Loi tai du lieu: {shipmentError || "Unknown error"}
                  </p>
              }
              </div>

              {canRetryShipment &&
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadCounter((current) => current + 1)}>

                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tai lai du lieu
                </Button>
            }
            </CardContent>
          </Card>
        }

        {isShipmentLoading && displayLegs.length === 0 &&
        <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Dang tai lo trinh van chuyen...
            </CardContent>
          </Card>
        }

        {displayLegs.length > 0 &&
        <TransportMap
          legs={displayLegs}
          mapSubject={mapSubject}
          mapSubjectMeta={mapSubjectMeta} />

        }

        {hasLookupInput && !isShipmentLoading && displayLegs.length === 0 &&
        <Card className="border-dashed border-amber-300 bg-amber-50/40">
            <CardContent className="p-4 text-sm text-amber-700">
              Chua co du lieu ban do cho san pham nay. Ban co the nhap thong tin
              van chuyen thu cong ben duoi.
            </CardContent>
          </Card>
        }

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TransportScopeSelector
              value={transportScope}
              onChange={setTransportScope} />


            {legs.map((leg, index) =>
            <TransportLegCard
              key={leg.id}
              leg={leg}
              index={index}
              canRemove={legs.length > 1}
              hasLocationPermission={hasLocationPermission}
              onUpdate={updateLeg}
              onRemove={handleRemoveLeg}
              calculateCO2={calculateLegCO2} />

            )}

            <Button
              variant="outline"
              onClick={handleAddLeg}
              className="w-full"
              disabled={isShipmentLoading}>

              <Plus className="w-4 h-4 mr-2" />
              {t("addLeg")}
            </Button>
          </div>

          <TransportResultsSidebar
            legs={legs}
            totalDistance={totalDistance}
            totalCO2={totalCO2}
            hasLocationPermission={hasLocationPermission}
            calculateLegCO2={calculateLegCO2}
            onSubmit={handleSubmit}
            isLoading={isShipmentLoading} />

        </div>
      </div>
    </>);

};

export default TransportClient;