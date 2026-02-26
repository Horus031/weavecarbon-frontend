import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plane,
  Ship,
  Truck,
  Train,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  ProductAssessmentData,
  AddressInput,
  TransportLeg,
  DESTINATION_MARKETS,
  TRANSPORT_MODES,
} from "./types";
import dynamic from "next/dynamic";

// Haversine distance calculation (great-circle distance in km)
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Fetch actual road distance from OSRM (OpenStreetMap Routing Machine)
async function fetchRoadDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`,
    );
    const data = await response.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      return Math.round(data.routes[0].distance / 1000); // meters -> km
    }
    return null;
  } catch {
    return null;
  }
}

interface LocationPickerProps {
  address: AddressInput;
  onChange: (address: AddressInput) => void;
  label: string;
  defaultCenter?: [number, number];
  autoDetectLocation?: boolean;
}

// Dynamically import LocationPicker to avoid SSR issues with Mapbox
const LocationPicker = dynamic<LocationPickerProps>(
  () => import("./LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="p-4 h-87.5 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 animate-pulse" />
            <span>{/* loading map placeholder */}</span>
          </div>
        </CardContent>
      </Card>
    ),
  },
);

interface Step4LogisticsProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}

// Transport mode icon
const TransportIcon: React.FC<{ mode: string; className?: string }> = ({
  mode,
  className = "w-4 h-4",
}) => {
  switch (mode) {
    case "road":
      return <Truck className={className} />;
    case "sea":
      return <Ship className={className} />;
    case "air":
      return <Plane className={className} />;
    case "rail":
      return <Train className={className} />;
    default:
      return <Truck className={className} />;
  }
};

// Get default map center for destination market
const getDestinationDefaultCenter = (market: string): [number, number] => {
  switch (market) {
    case "usa":
      return [-118.2437, 34.0522]; // Los Angeles
    case "korea":
      return [126.978, 37.5665]; // Seoul
    case "japan":
      return [139.6503, 35.6762]; // Tokyo
    case "eu":
      return [4.4777, 51.9244]; // Rotterdam
    case "china":
      return [121.4737, 31.2304]; // Shanghai
    case "vietnam":
    default:
      return [106.6297, 10.8231]; // Ho Chi Minh City
  }
};

const Step4Logistics: React.FC<Step4LogisticsProps> = ({ data, onChange }) => {
  const t = useTranslations("assessment.step4");
  const isInternational =
    data.destinationMarket && data.destinationMarket !== "vietnam";
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if both origin and destination have coordinates
  const hasOriginCoords = !!(data.originAddress.lat && data.originAddress.lng);
  const hasDestCoords = !!(
    data.destinationAddress.lat && data.destinationAddress.lng
  );
  const hasBothCoords = hasOriginCoords && hasDestCoords;

  // Update origin address
  const updateOriginAddress = (address: AddressInput) => {
    onChange({ originAddress: address });
  };

  // Update destination address
  const updateDestinationAddress = (address: AddressInput) => {
    onChange({ destinationAddress: address });
  };

  // Add transport leg
  const addTransportLeg = () => {
    const newLeg: TransportLeg = {
      id: `leg-${Date.now()}`,
      mode: "road",
      estimatedDistance: undefined,
    };
    onChange({ transportLegs: [...data.transportLegs, newLeg] });
  };

  // Remove transport leg
  const removeTransportLeg = (id: string) => {
    onChange({ transportLegs: data.transportLegs.filter((l) => l.id !== id) });
  };

  // Update transport leg
  const updateTransportLeg = (id: string, updates: Partial<TransportLeg>) => {
    onChange({
      transportLegs: data.transportLegs.map((l) =>
        l.id === id ? { ...l, ...updates } : l,
      ),
    });
  };

  // Calculate estimated total distance
  const totalDistance = data.transportLegs.reduce(
    (sum, leg) => sum + (leg.estimatedDistance || 0),
    0,
  );

  // Set destination address country based on market
  const handleMarketChange = (market: string) => {
    const marketInfo = DESTINATION_MARKETS.find((m) => m.value === market);
    let country = "Vietnam";

    switch (market) {
      case "usa":
        country = "United States";
        break;
      case "korea":
        country = "South Korea";
        break;
      case "japan":
        country = "Japan";
        break;
      case "eu":
        country = "Germany";
        break;
      case "china":
        country = "China";
        break;
      default:
        country = "Vietnam";
    }

    onChange({
      destinationMarket: market,
      destinationAddress: {
        ...data.destinationAddress,
        country,
      },
      estimatedTotalDistance: marketInfo?.distance || 500,
    });
  };

  return (
    <div className="space-y-6">
      {/* Destination Market Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {t("destinationMarket.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.destinationMarket}
            onValueChange={handleMarketChange}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder={t("destinationMarket.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {DESTINATION_MARKETS.map((market) => (
                <SelectItem key={market.value} value={market.value}>
                  {market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Address Tables - shown after market selection */}
      {data.destinationMarket && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <LocationPicker
              label={t("address.origin")}
              address={data.originAddress}
              onChange={updateOriginAddress}
              defaultCenter={[106.6297, 10.8231]} // Ho Chi Minh City
              autoDetectLocation={true}
            />
            <LocationPicker
              label={t("address.destination")}
              address={data.destinationAddress}
              onChange={updateDestinationAddress}
              defaultCenter={getDestinationDefaultCenter(
                data.destinationMarket,
              )}
            />
          </div>

          {/* Transport Legs */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {t("transport.title")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("transport.subtitle")}
                  </p>
                </div>
                {totalDistance > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {t("transport.totalDistance", {
                      distance: totalDistance.toLocaleString(),
                    })}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transport legs list */}
              {data.transportLegs.length > 0 && (
                <div className="space-y-3">
                  {data.transportLegs.map((leg, index) => {
                    const modeInfo = TRANSPORT_MODES.find(
                      (m) => m.value === leg.mode,
                    );
                    return (
                      <div
                        key={leg.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-2 min-w-25">
                          <span className="text-sm font-medium text-muted-foreground">
                            {t("transport.leg", { index: index + 1 })}
                          </span>
                          {index < data.transportLegs.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>

                        <Select
                          value={leg.mode}
                          onValueChange={(v: "road" | "sea" | "air" | "rail") =>
                            updateTransportLeg(leg.id, { mode: v })
                          }
                        >
                          <SelectTrigger className="w-45">
                            <div className="flex items-center gap-2">
                              <TransportIcon mode={leg.mode} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSPORT_MODES.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                <div className="flex items-center gap-2">
                                  <TransportIcon mode={mode.value} />
                                  <span>{mode.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            min="0"
                            value={leg.estimatedDistance || ""}
                            onChange={(e) =>
                              updateTransportLeg(leg.id, {
                                estimatedDistance: Number(e.target.value),
                              })
                            }
                            placeholder={t("transport.distancePlaceholder")}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            km
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({modeInfo?.co2Factor} kg CO₂e/tấn.km)
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransportLeg(leg.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                variant="outline"
                onClick={addTransportLeg}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("transport.addLeg")}
              </Button>

              {/* Suggested route for international */}
              {isInternational && data.transportLegs.length === 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <p className="text-sm font-medium mb-2">
                    {t("suggestedRoute.title")}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4" />
                    <span>{t("suggestedRoute.road")}</span>
                    <ArrowRight className="w-4 h-4" />
                    <Plane className="w-4 h-4" />
                    <span>{t("suggestedRoute.air")}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0"
                    disabled={isCalculating || !hasBothCoords}
                    onClick={async () => {
                      if (!hasBothCoords) return;

                      setIsCalculating(true);
                      try {
                        const originLat = data.originAddress.lat!;
                        const originLng = data.originAddress.lng!;
                        const destLat = data.destinationAddress.lat!;
                        const destLng = data.destinationAddress.lng!;

                        // Estimate road distance to nearest airport (~50km default, or use OSRM for accuracy)
                        // We use a fixed nearby airport assumption for the domestic road leg
                        const roadDistance =
                          (await fetchRoadDistance(
                            originLat,
                            originLng,
                            // Tan Son Nhat Airport (SGN) as default airport
                            10.8184,
                            106.6588,
                          )) || 30;

                        // Air distance: haversine between origin and destination
                        const airDistance = haversineDistance(
                          originLat,
                          originLng,
                          destLat,
                          destLng,
                        );

                        onChange({
                          transportLegs: [
                            {
                              id: `leg-${Date.now()}-1`,
                              mode: "road",
                              estimatedDistance: roadDistance,
                            },
                            {
                              id: `leg-${Date.now()}-2`,
                              mode: "air",
                              estimatedDistance: airDistance,
                            },
                          ],
                        });
                      } finally {
                        setIsCalculating(false);
                      }
                    }}
                  >
                    {isCalculating ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t("calculating")}
                      </span>
                    ) : (
                      t("suggestedRoute.apply")
                    )}
                  </Button>
                </div>
              )}

              {/* Suggested route for domestic */}
              {!isInternational &&
                data.destinationMarket &&
                data.transportLegs.length === 0 && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                    <p className="text-sm font-medium mb-2">
                      {t("suggestedRoute")}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="w-4 h-4" />
                      <span>{t("roadDomestic")}</span>
                    </div>
                    {!hasBothCoords && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠ {t("selectBothLocations")}
                      </p>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0"
                      disabled={isCalculating || !hasBothCoords}
                      onClick={async () => {
                        if (!hasBothCoords) return;

                        setIsCalculating(true);
                        try {
                          const originLat = data.originAddress.lat!;
                          const originLng = data.originAddress.lng!;
                          const destLat = data.destinationAddress.lat!;
                          const destLng = data.destinationAddress.lng!;

                          // Fetch actual road distance via OSRM
                          const roadDistance =
                            (await fetchRoadDistance(
                              originLat,
                              originLng,
                              destLat,
                              destLng,
                            )) ||
                            // Fallback to haversine * 1.3 (road factor)
                            Math.round(
                              haversineDistance(
                                originLat,
                                originLng,
                                destLat,
                                destLng,
                              ) * 1.3,
                            );

                          onChange({
                            transportLegs: [
                              {
                                id: `leg-${Date.now()}-1`,
                                mode: "road",
                                estimatedDistance: roadDistance,
                              },
                            ],
                          });
                        } finally {
                          setIsCalculating(false);
                        }
                      }}
                    >
                      {isCalculating ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t("calculating")}
                        </span>
                      ) : (
                        t("applySuggestion")
                      )}
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Step4Logistics;
