"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
interface ShipmentMiniMapProps {
  currentLocation: { lat: number; lng: number; name: string };
  height?: string;
  status?: "in_transit" | "delivered" | "pending";
}

const ShipmentMiniMap: React.FC<ShipmentMiniMapProps> = ({
  currentLocation,
  height = "150px",
  status = "in_transit",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getMarkerColor = () => {
      switch (status) {
        case "delivered":
          return "#22c55e";
        case "pending":
          return "#eab308";
        default:
          return "#3b82f6";
      }
    };

    const getStatusEmoji = () => {
      switch (status) {
        case "delivered":
          return "📦";
        case "pending":
          return "⏳";
        default:
          return "🚢";
      }
    };

    let isMounted = true;

    const initMap = () => {
      if (!mapContainerRef.current) return;

      try {
        if (!MAPBOX_TOKEN || !MAPBOX_TOKEN.startsWith("pk.")) {
          setError("Mapbox token is missing or invalid.");
          setIsLoading(false);
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Create map with minimal controls
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 5,
          pitch: 45,
          interactive: false, // Disable interaction for mini map
          attributionControl: false,
        });

        mapRef.current = map;

        map.on("load", () => {
          if (!isMounted) return;

          // Create custom marker element
          const markerEl = document.createElement("div");
          markerEl.innerHTML = `
            <div style="
              position: relative;
              width: 40px;
              height: 40px;
            ">
              <div style="
                position: absolute;
                width: 40px;
                height: 40px;
                background: ${getMarkerColor()};
                border-radius: 50%;
                animation: pulse 2s infinite;
                opacity: 0.4;
              "></div>
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${getMarkerColor()};
                border: 3px solid white;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              ">
                ${getStatusEmoji()}
              </div>
            </div>
          `;

          // Add pulse animation
          const style = document.createElement("style");
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.5); opacity: 0.1; }
              100% { transform: scale(1); opacity: 0.4; }
            }
          `;
          document.head.appendChild(style);

          const marker = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([currentLocation.lng, currentLocation.lat])
            .addTo(map);

          markerRef.current = marker;
          setIsLoading(false);
        });

        map.on("error", () => {
          if (isMounted) {
            setError("Map failed to load");
            setIsLoading(false);
          }
        });
      } catch (err) {
        if (isMounted) {
          console.error("Mini map initialization error:", err);
          setError("Failed to load map");
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentLocation.lat, currentLocation.lng, status]);

  if (error) {
    return (
      <div
        className="rounded-lg bg-muted flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Location label */}
      <div className="absolute bottom-1 left-1 right-1 bg-background/80 backdrop-blur rounded px-2 py-1">
        <p className="text-xs text-center truncate font-medium">
          {currentLocation.name}
        </p>
      </div>
    </div>
  );
};

export default ShipmentMiniMap;
