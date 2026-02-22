
"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Badge } from "@/components/ui/badge";
import type { SupplyChainNode, SupplyChainRoute } from "./SupplyChainMap";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SupplyChainMap3DProps {
  nodes: SupplyChainNode[];
  routes: SupplyChainRoute[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onNodeClick?: (node: SupplyChainNode) => void;
  onRouteClick?: (route: SupplyChainRoute) => void;
}

const getRouteColor = (mode: string, status: string) => {
  if (status === "completed") return "#22c55e";
  if (status === "pending") return "#9ca3af";

  switch (mode) {
    case "ship":
      return "#3b82f6";
    case "air":
      return "#8b5cf6";
    case "truck":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
};

const getTypeEmoji = (type: string) => {
  switch (type) {
    case "factory":
      return "🏭";
    case "warehouse":
      return "📦";
    case "port":
      return "⚓";
    case "airport":
      return "✈️";
    case "destination":
      return "📍";
    default:
      return "📌";
  }
};

const getMarkerColor = (status?: string) => {
  if (status === "completed") return "#22c55e";
  if (status === "pending") return "#eab308";
  return "#3b82f6";
};

const SupplyChainMap3D: React.FC<SupplyChainMap3DProps> = ({
  nodes,
  routes,
  center = [108.2772, 14.0583],
  zoom = 4,
  height = "500px",
  onNodeClick,
  onRouteClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: center,
        zoom: zoom,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      map.addControl(new mapboxgl.NavigationControl());
      map.addControl(new mapboxgl.FullscreenControl());

      map.on("load", () => {
        if (isMounted) {
          mapRef.current = map;
          setIsLoading(false);
        }
      });

      map.on("error", (e) => {
        if (isMounted) {
          console.error("Map error:", e);
          setError("Failed to load map");
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      if (isMounted) {
        console.error("Map initialization error:", err);
        setError("Failed to load map");
        setIsLoading(false);
      }
    }
  }, [center, zoom]);


  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const addRoutesAndMarkers = () => {

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      routes.forEach((_, idx) => {
        const lineId = `route-line-${idx}`;
        const sourceId = `route-source-${idx}`;
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });

      routes.forEach((route, idx) => {
        const sourceId = `route-source-${idx}`;
        const lineId = `route-line-${idx}`;

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
              [route.from.lng, route.from.lat],
              [route.to.lng, route.to.lat]]

            }
          } as GeoJSON.Feature
        });

        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": getRouteColor(route.mode, route.status),
            "line-width": route.status === "in_transit" ? 4 : 2,
            "line-opacity": route.status === "pending" ? 0.5 : 0.8,
            ...(route.status === "pending" && { "line-dasharray": [2, 2] })
          }
        });

        map.on("click", lineId, () => {
          if (onRouteClick) onRouteClick(route);
        });

        map.on("mouseenter", lineId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", lineId, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      nodes.forEach((node) => {
        const el = document.createElement("div");
        el.className = "custom-3d-marker";
        el.innerHTML = `
          <div style="
            background-color: ${getMarkerColor(node.status)};
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            cursor: pointer;
          ">
            ${getTypeEmoji(node.type)}
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true
        }).setHTML(`
          <div style="padding: 12px; min-width: 220px; font-family: system-ui;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${node.name}</h3>
            <p style="margin: 4px 0;">🏭 <strong>Type:</strong> ${node.type}</p>
            <p style="margin: 4px 0;">🌍 <strong>Country:</strong> ${node.country}</p>
            ${node.co2 !== undefined ? `<p style="margin: 4px 0;">♻️ <strong>CO₂:</strong> ${node.co2} tCO₂</p>` : ""}
          </div>
        `);

        const marker = new mapboxgl.Marker(el).
        setLngLat([node.lng, node.lat]).
        setPopup(popup).
        addTo(map);

        if (onNodeClick) {
          el.addEventListener("click", () => onNodeClick(node));
        }

        markersRef.current.push(marker);
      });

      if (nodes.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        nodes.forEach((node) => bounds.extend([node.lng, node.lat]));
        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 10
        });
      }
    };

    if (map.loaded()) {
      addRoutesAndMarkers();
    } else {
      map.on("load", addRoutesAndMarkers);
    }
  }, [nodes, routes, onNodeClick, onRouteClick]);

  if (isLoading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-muted rounded-lg border">
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading 3D map...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-muted rounded-lg border">
        
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <Badge variant="secondary">Replace token in code</Badge>
        </div>
      </div>);

  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} style={{ height, width: "100%" }} />

      <div className="absolute top-4 left-4 z-10">
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          🌍 3D Satellite View
        </Badge>
      </div>

      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border z-10">
        <p className="text-xs font-semibold mb-2">Legend</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded" />
            <span>Sea Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-amber-500 rounded" />
            <span>Road Route</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur rounded-lg p-2 shadow-lg border z-10">
        <p className="text-xs text-muted-foreground">
          🖱️ Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>);

};

export default SupplyChainMap3D;