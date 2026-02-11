/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Plane,
  Truck,
  Navigation,
  Globe,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { TransportLeg } from "@/types/transport";
import { useTranslations } from "next-intl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface TransportMapProps {
  legs: TransportLeg[];
  onRefresh?: () => void;
}

const TransportMap: React.FC<TransportMapProps> = ({ legs, onRefresh }) => {
  const t = useTranslations("trackShipment");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "ship":
        return Ship;
      case "air":
        return Plane;
      default:
        return Truck;
    }
  };

  const getModeColor = useCallback((mode: string) => {
    switch (mode) {
      case "ship":
        return "#3b82f6";
      case "air":
        return "#8b5cf6";
      case "truck_heavy":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  }, []);

  const getModeEmoji = (mode: string) => {
    switch (mode) {
      case "ship":
        return "🚢";
      case "air":
        return "✈️";
      default:
        return "🚛";
    }
  };

  const getRouteTypeLabel = (routeType: string) => {
    switch (routeType) {
      case "sea":
        return "Đường biển";
      case "air":
        return "Đường không";
      default:
        return "Đường bộ";
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN || "";

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [108.2772, 14.0583],
        zoom: 2,
        projection: "mercator" as any,
        bearing: 0,
        pitch: 0,
        maxPitch: 0,
      });

      // Set map ref immediately so drawing effect can access it
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl());

      const onMapLoad = () => {
        setIsLoading(false);
      };

      map.on("load", onMapLoad);

      map.on("error", (e) => {
        console.error("Map error:", e);
        setIsLoading(false);
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (map) {
          map.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setIsLoading(false);
    }
  }, []);

  // Animate marker along a route
  const animateMarker = (leg: TransportLeg, legIndex: number) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    setIsAnimating(true);

    // Remove existing animation marker
    if (animationMarkerRef.current) {
      animationMarkerRef.current.remove();
    }

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Create animated marker element
    const el = document.createElement("div");
    el.className = "animate-marker";
    el.innerHTML = `
      <div style="
        background-color: ${getModeColor(leg.mode)};
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      ">
        ${getModeEmoji(leg.mode)}
      </div>
    `;

    const marker = new mapboxgl.Marker(el);
    animationMarkerRef.current = marker;

    const start = [leg.origin.lng, leg.origin.lat];
    const end = [leg.destination.lng, leg.destination.lat];

    // Calculate total steps based on distance (longer routes = more steps)
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2),
    );
    const totalSteps = Math.max(100, Math.min(300, distance * 20));
    let currentStep = 0;

    // Zoom to the route with better zoom levels
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([leg.origin.lng, leg.origin.lat]);
    bounds.extend([leg.destination.lng, leg.destination.lat]);

    // Calculate zoom level based on distance
    let maxZoom;
    if (distance < 0.5) {
      maxZoom = 12; // Very close routes (domestic)
    } else if (distance < 2) {
      maxZoom = 9; // Short routes
    } else if (distance < 10) {
      maxZoom = 6; // Medium routes
    } else {
      maxZoom = 4; // Long international routes
    }

    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      duration: 1000,
      maxZoom: maxZoom,
    });

    // Highlight the selected route
    const lineId = `route-line-${legIndex}`;
    const glowId = `route-glow-${legIndex}`;
    if (map.getLayer(lineId)) {
      map.setPaintProperty(lineId, "line-width", 5);
      map.setPaintProperty(lineId, "line-opacity", 1);
    }
    if (map.getLayer(glowId)) {
      map.setPaintProperty(glowId, "line-width", 12);
      map.setPaintProperty(glowId, "line-opacity", 0.5);
    }

    const animate = () => {
      if (currentStep >= totalSteps) {
        // Loop: restart animation instead of stopping
        currentStep = 0;
      }

      const progress = currentStep / totalSteps;

      // Ease-in-out interpolation
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentLng = start[0] + (end[0] - start[0]) * easeProgress;
      const currentLat = start[1] + (end[1] - start[1]) * easeProgress;

      marker.setLngLat([currentLng, currentLat]).addTo(map);

      currentStep++;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Handle leg selection
  const handleLegClick = (legIndex: number) => {
    if (selectedLeg === legIndex) {
      setSelectedLeg(null);
      setIsAnimating(false);

      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Remove animation marker
      if (animationMarkerRef.current) {
        animationMarkerRef.current.remove();
        animationMarkerRef.current = null;
      }

      // Reset all line styles
      if (mapRef.current) {
        legs.forEach((_, idx) => {
          const lineId = `route-line-${idx}`;
          const glowId = `route-glow-${idx}`;
          if (mapRef.current!.getLayer(lineId)) {
            mapRef.current!.setPaintProperty(lineId, "line-width", 3);
            mapRef.current!.setPaintProperty(lineId, "line-opacity", 0.8);
          }
          if (mapRef.current!.getLayer(glowId)) {
            mapRef.current!.setPaintProperty(glowId, "line-width", 8);
            mapRef.current!.setPaintProperty(glowId, "line-opacity", 0.3);
          }
        });
      }

      // Zoom back to show all routes
      if (mapRef.current && legs.length > 0) {
        const allPoints: any[] = [];
        legs.forEach((leg, index) => {
          if (index === 0) {
            allPoints.push({
              ...leg.origin,
              isOrigin: true,
              isDestination: false,
            });
          }
          allPoints.push({
            ...leg.destination,
            isOrigin: false,
            isDestination: index === legs.length - 1,
          });
        });

        const bounds = new mapboxgl.LngLatBounds();
        allPoints.forEach((point) => bounds.extend([point.lng, point.lat]));
        mapRef.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 10,
          duration: 1000,
        });
      }
    } else {
      setSelectedLeg(legIndex);
      animateMarker(legs[legIndex], legIndex);
    }
  };

  // Clean up animation when legs change (product switches)
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (animationMarkerRef.current) {
      animationMarkerRef.current.remove();
      animationMarkerRef.current = null;
    }

    setSelectedLeg(null);
    setIsAnimating(false);
  }, [legs]);

  // Draw routes when legs change (but not during initial map setup)
  useEffect(() => {
    if (!mapRef.current || legs.length === 0) return;

    const map = mapRef.current;

    const drawRoutes = () => {
      if (!map.loaded() || !map.isStyleLoaded()) return;

      try {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Remove existing layers and sources
        legs.forEach((_, idx) => {
          const lineId = `route-line-${idx}`;
          const glowId = `route-glow-${idx}`;
          const sourceId = `route-source-${idx}`;
          if (map.getLayer(lineId)) map.removeLayer(lineId);
          if (map.getLayer(glowId)) map.removeLayer(glowId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        });

        // Add route lines with glow effect
        legs.forEach((leg, idx) => {
          const sourceId = `route-source-${idx}`;
          const lineId = `route-line-${idx}`;
          const glowId = `route-glow-${idx}`;

          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [leg.origin.lng, leg.origin.lat],
                  [leg.destination.lng, leg.destination.lat],
                ],
              },
            } as GeoJSON.Feature,
          });

          // Add glow layer
          map.addLayer({
            id: glowId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": getModeColor(leg.mode),
              "line-width": 8,
              "line-opacity": 0.3,
              "line-blur": 4,
            },
          });

          // Add main line
          map.addLayer({
            id: lineId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": getModeColor(leg.mode),
              "line-width": 3,
              "line-opacity": 0.8,
              ...(leg.mode === "air" && {
                "line-dasharray": [2, 2],
              }),
            },
          });
        });

        // Add markers for all unique locations
        const allPoints: any[] = [];
        legs.forEach((leg, index) => {
          if (index === 0) {
            allPoints.push({
              ...leg.origin,
              isOrigin: true,
              isDestination: false,
            });
          }
          allPoints.push({
            ...leg.destination,
            isOrigin: false,
            isDestination: index === legs.length - 1,
          });
        });

        allPoints.forEach((point) => {
          const el = document.createElement("div");
          el.className = "custom-marker";
          el.innerHTML = `
            <div style="
              background-color: ${point.isOrigin ? "#22c55e" : point.isDestination ? "#ef4444" : "#3b82f6"};
              color: white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              ${point.isOrigin ? "🏭" : point.isDestination ? "📍" : "⚓"}
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <p style="font-weight: bold; margin-bottom: 4px;">${point.name}</p>
              <p style="font-size: 12px; color: #666;">
                ${point.isOrigin ? "Điểm xuất phát" : point.isDestination ? "Điểm đến" : "Điểm trung chuyển"}
              </p>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([point.lng, point.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });

        // Fit map to show all points
        if (allPoints.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          allPoints.forEach((point) => bounds.extend([point.lng, point.lat]));
          map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            maxZoom: 10,
            duration: 1000, // Smooth transition
          });
        }
      } catch (err) {
        console.error("Error drawing routes:", err);
      }
    };

    // If map is already loaded, draw immediately
    if (map.loaded() && map.isStyleLoaded()) {
      drawRoutes();
    } else {
      // Otherwise wait for it to load
      const handleLoad = () => {
        drawRoutes();
      };
      map.once("load", handleLoad);

      return () => {
        map.off("load", handleLoad);
      };
    }
  }, [legs, getModeColor]);

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
  const totalCO2 = legs.reduce((sum, leg) => sum + leg.co2Kg, 0);
  const estimatedDays = legs.reduce((days, leg) => {
    if (leg.mode === "ship") return days + Math.ceil(leg.distanceKm / 500);
    if (leg.mode === "air") return days + 1;
    return days + Math.ceil(leg.distanceKm / 800);
  }, 0);

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm">
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
          }
        }
      `}</style>
      <CardHeader className="pb-2 bg-background">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            Bản đồ tuyến vận chuyển
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAnimating && (
              <Badge variant="outline" className="animate-pulse">
                Đang mô phỏng...
              </Badge>
            )}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("refresh")}
                </Button>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-background">
        {/* Map Container */}
        <div className="relative h-100 bg-muted border-b border-border">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Đang tải bản đồ...
                </p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Stats Panel */}
        <div className="p-4 bg-background">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-2xl font-bold text-primary">
                {totalDistance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                km tổng quãng đường
              </p>
            </div>
            <div className="text-center rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-2xl font-bold text-orange-500">
                {totalCO2.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">kg CO₂e phát thải</p>
            </div>
            <div className="text-center rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-2xl font-bold text-blue-500">{legs.length}</p>
              <p className="text-xs text-muted-foreground">chặng vận chuyển</p>
            </div>
            <div className="text-center rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-2xl font-bold text-green-500">
                ~{estimatedDays}
              </p>
              <p className="text-xs text-muted-foreground">ngày vận chuyển</p>
            </div>
          </div>

          {/* Legs breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Chi tiết tuyến đường
              <span className="text-xs text-muted-foreground font-normal">
                (Click để xem mô phỏng)
              </span>
            </p>
            {legs.map((leg, index) => {
              const Icon = getModeIcon(leg.mode);
              return (
                <div
                  key={leg.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer
                    ${selectedLeg === index ? "bg-primary/10 border-2 border-primary shadow-lg scale-[1.02]" : "bg-muted/30 hover:bg-muted/50 border border-border"}`}
                  onClick={() => handleLegClick(index)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                    style={{ backgroundColor: getModeColor(leg.mode) }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate">
                        {leg.origin.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">
                        {leg.destination.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{leg.distanceKm.toLocaleString()} km</span>
                      <span>•</span>
                      <span>{getRouteTypeLabel(leg.routeType)}</span>
                      <span>•</span>
                      <span className="text-orange-500">
                        {leg.co2Kg.toFixed(2)} kg CO₂
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      leg.type === "international" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {leg.type === "international" ? "Quốc tế" : "Nội địa"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransportMap;
