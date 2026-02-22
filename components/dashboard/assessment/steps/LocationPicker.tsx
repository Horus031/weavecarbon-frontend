"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X, Navigation } from "lucide-react";
import { AddressInput } from "./types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LocationPickerProps {
  address: AddressInput;
  onChange: (address: AddressInput) => void;
  label: string;
  defaultCenter?: [number, number];
}

interface GeocodingResult {
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
  address?: string;
  text?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  onChange,
  label,
  defaultCenter = [106.6297, 10.8231]
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const initialAddressRef = useRef({ lat: address.lat, lng: address.lng });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const addressRef = useRef(address);
  addressRef.current = address;

  const parseGeocodingResult = useCallback(
    (feature: GeocodingResult): Partial<AddressInput> => {
      const result: Partial<AddressInput> = {};

      if (feature.address) {
        result.streetNumber = feature.address;
      }
      if (feature.text) {
        result.street = feature.text;
      }

      if (feature.context) {
        feature.context.forEach((ctx) => {
          if (
          ctx.id.startsWith("locality") ||
          ctx.id.startsWith("neighborhood"))
          {
            result.ward = ctx.text;
          } else if (ctx.id.startsWith("district")) {
            result.district = ctx.text;
          } else if (ctx.id.startsWith("place")) {
            result.city = ctx.text;
          } else if (ctx.id.startsWith("region")) {
            result.stateRegion = ctx.text;
          } else if (ctx.id.startsWith("country")) {
            result.country = ctx.text;
          } else if (ctx.id.startsWith("postcode")) {
            result.postalCode = ctx.text;
          }
        });
      }

      return result;
    },
    []
  );

  const reverseGeocode = useCallback(
    async (lng: number, lat: number) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const addressParts = parseGeocodingResult(feature);

          onChangeRef.current({
            ...addressRef.current,
            ...addressParts,
            lat,
            lng
          });
        } else {
          onChangeRef.current({
            ...addressRef.current,
            lat,
            lng
          });
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        onChangeRef.current({
          ...addressRef.current,
          lat,
          lng
        });
      }
    },
    [parseGeocodingResult]
  );

  const addMarker = useCallback(
    (lng: number, lat: number) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = new mapboxgl.Marker({
        color: "#10b981",
        draggable: true
      }).
      setLngLat([lng, lat]).
      addTo(mapRef.current);

      marker.on("dragend", async () => {
        const lngLat = marker.getLngLat();
        await reverseGeocode(lngLat.lng, lngLat.lat);
      });

      markerRef.current = marker;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1000
      });
    },
    [reverseGeocode]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN || "";

      const initialLat = initialAddressRef.current.lat;
      const initialLng = initialAddressRef.current.lng;
      const initialCenter: [number, number] =
      initialLng && initialLat ? [initialLng, initialLat] : defaultCenter;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom: initialLat && initialLng ? 14 : 10,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        if (initialLat && initialLng) {
          const marker = new mapboxgl.Marker({
            color: "#10b981",
            draggable: true
          }).
          setLngLat([initialLng, initialLat]).
          addTo(map);

          marker.on("dragend", async () => {
            const lngLat = marker.getLngLat();
            await reverseGeocode(lngLat.lng, lngLat.lat);
          });

          markerRef.current = marker;
        }
      });

      map.on("click", async (e) => {
        const { lng, lat } = e.lngLat;
        addMarker(lng, lat);
        await reverseGeocode(lng, lat);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5&language=vi`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const selectLocation = async (result: GeocodingResult) => {
    const [lng, lat] = result.center;
    addMarker(lng, lat);

    const addressParts = parseGeocodingResult(result);
    onChange({
      ...address,
      ...addressParts,
      lat,
      lng
    });

    setSearchQuery(result.place_name);
    setShowResults(false);
    setSearchResults([]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchLocation(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        addMarker(longitude, latitude);
        await reverseGeocode(longitude, latitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Không thể lấy vị trí hiện tại");
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          {label}
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm địa chỉ..."
                className="pl-9 pr-8"
                onFocus={() => searchResults.length > 0 && setShowResults(true)} />
              
              {searchQuery &&
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                
                  <X className="w-4 h-4" />
                </button>
              }
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              title="Vị trí hiện tại">
              
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {showResults && searchResults.length > 0 &&
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((result, index) =>
            <button
              key={index}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2"
              onClick={() => selectLocation(result)}>
              
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{result.place_name}</span>
                </button>
            )}
            </div>
          }
        </div>

        <div
          ref={mapContainerRef}
          className="w-full rounded-lg overflow-hidden border"
          style={{ height: "250px" }} />


        {address.lat && address.lng &&
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
            <MapPin className="w-3 h-3" />
            <span>
              {address.lat.toFixed(6)}, {address.lng.toFixed(6)}
            </span>
            {address.city &&
          <>
                <span className="mx-1">•</span>
                <span>
                  {address.city}, {address.country}
                </span>
              </>
          }
          </div>
        }

        <p className="text-xs text-muted-foreground">
          💡 Nhấp vào bản đồ hoặc kéo thả marker để chọn vị trí chính xác
        </p>
      </CardContent>
    </Card>);

};

export default LocationPicker;