"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
  ArrowRight
} from "lucide-react";
import {
  ProductAssessmentData,
  AddressInput,
  TransportLeg,
  DESTINATION_MARKETS,
  TRANSPORT_MODES
} from "./types";
import dynamic from "next/dynamic";

interface LocationPickerProps {
  address: AddressInput;
  onChange: (address: AddressInput) => void;
  label: string;
  defaultCenter?: [number, number];
}

const TransportIcon: React.FC<{ mode: string; className?: string }> = ({
  mode,
  className = "w-4 h-4"
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

const getDestinationDefaultCenter = (market: string): [number, number] => {
  switch (market) {
    case "usa":
      return [-118.2437, 34.0522];
    case "korea":
      return [126.978, 37.5665];
    case "japan":
      return [139.6503, 35.6762];
    case "eu":
      return [4.4777, 51.9244];
    case "china":
      return [121.4737, 31.2304];
    case "vietnam":
    default:
      return [106.6297, 10.8231];
  }
};

const LocationPickerLoading = () => {
  const t = useTranslations("assessment.step4");

  return (
    <Card>
      <CardContent className="p-4 h-87.5 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 animate-pulse" />
          <span>{t("loadingMap")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const LocationPicker = dynamic<LocationPickerProps>(
  () => import("./LocationPicker"),
  {
    ssr: false,
    loading: () => <LocationPickerLoading />
  }
);

interface Step4LogisticsProps {
  data: ProductAssessmentData;
  onChange: (updates: Partial<ProductAssessmentData>) => void;
}

const Step4Logistics: React.FC<Step4LogisticsProps> = ({ data, onChange }) => {
  const t = useTranslations("assessment.step4");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";
  const isInternational = data.destinationMarket && data.destinationMarket !== "vietnam";

  const updateOriginAddress = (address: AddressInput) => {
    onChange({ originAddress: address });
  };

  const updateDestinationAddress = (address: AddressInput) => {
    onChange({ destinationAddress: address });
  };

  const addTransportLeg = () => {
    const newLeg: TransportLeg = {
      id: `leg-${Date.now()}`,
      mode: "road",
      estimatedDistance: undefined
    };

    onChange({ transportLegs: [...data.transportLegs, newLeg] });
  };

  const removeTransportLeg = (id: string) => {
    onChange({ transportLegs: data.transportLegs.filter((leg) => leg.id !== id) });
  };

  const updateTransportLeg = (id: string, updates: Partial<TransportLeg>) => {
    onChange({
      transportLegs: data.transportLegs.map((leg) =>
        leg.id === id ? { ...leg, ...updates } : leg
      )
    });
  };

  const totalDistance = data.transportLegs.reduce(
    (sum, leg) => sum + (leg.estimatedDistance || 0),
    0
  );

  const handleMarketChange = (market: string) => {
    const marketInfo = DESTINATION_MARKETS.find((item) => item.value === market);
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
        country
      },
      estimatedTotalDistance: marketInfo?.distance || 500
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t("destinationMarket.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={data.destinationMarket} onValueChange={handleMarketChange}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder={t("destinationMarket.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {DESTINATION_MARKETS.map((market) => (
                <SelectItem key={market.value} value={market.value}>
                  {t.has(`markets.${market.value}`)
                    ? t(`markets.${market.value}`)
                    : market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {data.destinationMarket ? (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <LocationPicker
              label={t("address.origin")}
              address={data.originAddress}
              onChange={updateOriginAddress}
              defaultCenter={[106.6297, 10.8231]}
            />
            <LocationPicker
              label={t("address.destination")}
              address={data.destinationAddress}
              onChange={updateDestinationAddress}
              defaultCenter={getDestinationDefaultCenter(data.destinationMarket)}
            />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t("transport.title")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("transport.subtitle")}
                  </p>
                </div>

                {totalDistance > 0 ? (
                  <Badge variant="outline" className="text-sm">
                    {t("transport.totalDistance", {
                      value: totalDistance.toLocaleString(displayLocale)
                    })}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {data.transportLegs.length > 0 ? (
                <div className="space-y-3">
                  {data.transportLegs.map((leg, index) => {
                    const modeInfo = TRANSPORT_MODES.find((mode) => mode.value === leg.mode);

                    return (
                      <div
                        key={leg.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-2 min-w-25">
                          <span className="text-sm font-medium text-muted-foreground">
                            {t("transport.leg", { index: index + 1 })}
                          </span>
                          {index < data.transportLegs.length - 1 ? (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          ) : null}
                        </div>

                        <Select
                          value={leg.mode}
                          onValueChange={(value: "road" | "sea" | "air" | "rail") =>
                            updateTransportLeg(leg.id, { mode: value })
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
                                  <span>
                                    {t.has(`transportModes.${mode.value}`)
                                      ? t(`transportModes.${mode.value}`)
                                      : mode.label}
                                  </span>
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
                            onChange={(event) =>
                              updateTransportLeg(leg.id, {
                                estimatedDistance: Number(event.target.value)
                              })
                            }
                            placeholder={t("transport.distancePlaceholder")}
                            className="w-32"
                          />

                          <span className="text-sm text-muted-foreground">{t("transport.distanceUnit")}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {t("transport.co2Factor", { value: modeInfo?.co2Factor || 0 })}
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
              ) : null}

              <Button
                variant="outline"
                onClick={addTransportLeg}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("transport.addLeg")}
              </Button>

              {isInternational && data.transportLegs.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <p className="text-sm font-medium mb-2">{t("suggestedRoute.title")}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4" />
                    <span>{t("suggestedRoute.road")}</span>
                    <ArrowRight className="w-4 h-4" />
                    <Ship className="w-4 h-4" />
                    <span>{t("suggestedRoute.sea")}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0"
                    onClick={() => {
                      const marketInfo = DESTINATION_MARKETS.find(
                        (market) => market.value === data.destinationMarket
                      );

                      onChange({
                        transportLegs: [
                          {
                            id: `leg-${Date.now()}-1`,
                            mode: "road",
                            estimatedDistance: 50
                          },
                          {
                            id: `leg-${Date.now()}-2`,
                            mode: "sea",
                            estimatedDistance: marketInfo?.distance || 5000
                          }
                        ]
                      });
                    }}
                  >
                    {t("suggestedRoute.apply")}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default Step4Logistics;
