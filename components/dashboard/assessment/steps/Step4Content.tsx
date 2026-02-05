import React from "react";
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
} from "lucide-react";
import {
  ProductAssessmentData,
  AddressInput,
  TransportLeg,
  DESTINATION_MARKETS,
  TRANSPORT_MODES,
} from "./types";
import dynamic from "next/dynamic";

interface LocationPickerProps {
  address: AddressInput;
  onChange: (address: AddressInput) => void;
  label: string;
  defaultCenter?: [number, number];
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
            <span>Đang tải bản đồ...</span>
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
  const isInternational =
    data.destinationMarket && data.destinationMarket !== "vietnam";

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
          <CardTitle className="text-lg">Thị trường đích</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.destinationMarket}
            onValueChange={handleMarketChange}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Chọn thị trường tiêu thụ" />
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
              label="A. Địa chỉ nơi giao (Origin)"
              address={data.originAddress}
              onChange={updateOriginAddress}
              defaultCenter={[106.6297, 10.8231]} // Ho Chi Minh City
            />
            <LocationPicker
              label="B. Địa chỉ nơi nhận (Destination)"
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
                    Phương thức vận chuyển
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thêm các chặng vận chuyển từ nơi giao đến nơi nhận
                  </p>
                </div>
                {totalDistance > 0 && (
                  <Badge variant="outline" className="text-sm">
                    Tổng: ~{totalDistance.toLocaleString()} km
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
                            Chặng {index + 1}
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
                            placeholder="Km ước tính"
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
                Thêm chặng vận chuyển
              </Button>

              {/* Suggested route for international */}
              {isInternational && data.transportLegs.length === 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <p className="text-sm font-medium mb-2">
                    Gợi ý tuyến vận chuyển:
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4" />
                    <span>Đường bộ (nội địa)</span>
                    <ArrowRight className="w-4 h-4" />
                    <Ship className="w-4 h-4" />
                    <span>Đường biển (quốc tế)</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0"
                    onClick={() => {
                      const marketInfo = DESTINATION_MARKETS.find(
                        (m) => m.value === data.destinationMarket,
                      );
                      onChange({
                        transportLegs: [
                          {
                            id: `leg-${Date.now()}-1`,
                            mode: "road",
                            estimatedDistance: 50,
                          },
                          {
                            id: `leg-${Date.now()}-2`,
                            mode: "sea",
                            estimatedDistance: marketInfo?.distance || 5000,
                          },
                        ],
                      });
                    }}
                  >
                    Áp dụng gợi ý này
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
