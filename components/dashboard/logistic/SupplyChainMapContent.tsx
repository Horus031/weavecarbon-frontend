

"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { SupplyChainNode, SupplyChainRoute } from "./SupplyChainMap";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

console.log("MAPBOX_TOKEN:", MAPBOX_TOKEN ? "✅ Found" : "❌ Not found");

interface SupplyChainMapContentProps {
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

const getRouteWeight = (status: string) => {
  if (status === "in_transit") return 4;
  if (status === "completed") return 3;
  return 2;
};

const getRouteDashArray = (mode: string, status: string) => {
  if (status === "pending") return "10,10";
  if (mode === "air") return "8,8";
  return undefined;
};

const getMarkerColor = (status?: string) => {
  if (status === "completed") return "#22c55e";
  if (status === "pending") return "#eab308";
  return "#3b82f6";
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

const SupplyChainMapContent: React.FC<SupplyChainMapContentProps> = ({
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
    if (mapRef.current) {
      console.log("Map already initialized");
      return;
    }

    if (!mapContainerRef.current) {
      console.log("No container ref");
      return;
    }

    let isMounted = true;
    let loadTimeout: NodeJS.Timeout | undefined;

    try {
      if (!MAPBOX_TOKEN) {
        throw new Error("MAPBOX_TOKEN not found in environment variables");
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: center,
        zoom: zoom,
        antialias: true,
        pitch: 0,
        bearing: 0,
        maxPitch: 0,
        projection: "mercator" as any
      });


      loadTimeout = setTimeout(() => {
        if (isMounted && mapRef.current) {
          console.warn("Map load timeout - proceeding anyway");
          setIsLoading(false);
        }
      }, 8000);

      map.addControl(new mapboxgl.NavigationControl());

      const handleLoad = () => {
        clearTimeout(loadTimeout);
        if (isMounted) {
          setIsLoading(false);
          setError(null);
        }
      };

      const handleError = (e: any) => {
        if (loadTimeout) clearTimeout(loadTimeout);
        console.error("❌ Mapbox error:", e);
        if (isMounted) {
          setError("Failed to load map");
          setIsLoading(false);
        }
      };

      map.on("load", handleLoad);
      map.on("error", handleError);

      mapRef.current = map;

      return () => {
        isMounted = false;
        if (loadTimeout) clearTimeout(loadTimeout);
        if (map) {
          map.off("load", handleLoad);
          map.off("error", handleError);
          map.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      if (loadTimeout) clearTimeout(loadTimeout);
      if (isMounted) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Map error:", message);
        setError(message);
        setIsLoading(false);
      }
    }
  }, [center, zoom]);


  useEffect(() => {
    if (!mapRef.current) {
      console.log("Map not ready yet");
      return;
    }

    const map = mapRef.current;


    const addRoutesAndMarkers = () => {
      if (!map.loaded() || !map.getCanvas()) {
        console.log("Waiting for map to fully load...");
        setTimeout(addRoutesAndMarkers, 100);
        return;
      }

      console.log("✅ Rendering routes and markers now");

      try {

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];


        routes.forEach((_, idx) => {
          const lineId = `route-line-${idx}`;
          const sourceId = `route-source-${idx}`;
          try {
            if (map.getLayer(lineId)) map.removeLayer(lineId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
          } catch (e) {

          }
        });


        routes.forEach((route, idx) => {
          const sourceId = `route-source-${idx}`;
          const lineId = `route-line-${idx}`;

          try {
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

            const color = getRouteColor(route.mode, route.status);
            const weight = getRouteWeight(route.status);
            const dashArray = getRouteDashArray(route.mode, route.status);

            map.addLayer({
              id: lineId,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": color,
                "line-width": weight,
                "line-opacity": route.status === "pending" ? 0.5 : 0.8,
                ...(dashArray && {
                  "line-dasharray": dashArray.
                  split(",").
                  map((v) => parseInt(v))
                })
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
          } catch (e) {
            console.warn(`Error adding route ${idx}:`, e);
          }
        });


        nodes.forEach((node) => {
          try {
            const el = document.createElement("div");
            el.className = "custom-marker";
            el.innerHTML = `
              <div style="
                background-color: ${getMarkerColor(node.status)};
                color: white;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer;
              ">
                ${getTypeEmoji(node.type)}
              </div>
            `;

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px; min-width: 220px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${node.name}</div>
                <div style="font-size: 14px; line-height: 1.5;">
                  <p>🏭 <strong>Type:</strong> ${node.type}</p>
                  <p>🌍 <strong>Country:</strong> ${node.country}</p>
                  ${node.co2 !== undefined ? `<p>♻️ <strong>CO₂:</strong> ${node.co2} tCO₂</p>` : ""}
                </div>
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
          } catch (e) {
            console.warn(`Error adding marker for node ${node.id}:`, e);
          }
        });


        if (nodes.length > 1) {
          try {
            const bounds = new mapboxgl.LngLatBounds();
            nodes.forEach((node) => bounds.extend([node.lng, node.lat]));
            map.fitBounds(bounds, { padding: 50, maxZoom: 10 });
          } catch (e) {
            console.warn("Error fitting bounds:", e);
          }
        }
      } catch (e) {
        console.error("Error rendering map:", e);
      }
    };


    if (map.loaded()) {
      addRoutesAndMarkers();
    } else {
      console.log("Map not yet loaded, waiting for load event...");
      const onMapLoad = () => {
        addRoutesAndMarkers();
        map.off("load", onMapLoad);
      };
      map.once("load", onMapLoad);
    }
  }, [nodes, routes, onNodeClick, onRouteClick]);

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-muted rounded-lg border">
        
        <div className="text-center">
          <p className="text-sm text-destructive font-semibold mb-2">
            ⚠️ Error
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
          </p>
        </div>
      </div>);

  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="z-0" />
      

      {isLoading &&
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      }

      
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border z-10">
        <p className="text-xs font-semibold mb-2">Legend</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded" />
            <span>Sea Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-1 bg-purple-500 rounded"
              style={{ borderStyle: "dashed" }} />
            
            <span>Air Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-amber-500 rounded" />
            <span>Road Route</span>
          </div>
        </div>
      </div>
    </div>);

};

export default SupplyChainMapContent;