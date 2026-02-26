"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X, Navigation, Loader2 } from "lucide-react";
import { AddressInput } from "./types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LocationPickerProps {
  address: AddressInput;
  onChange: (address: AddressInput) => void;
  label: string;
  defaultCenter?: [number, number]; // [lng, lat]
  autoDetectLocation?: boolean; // Auto-detect current location on mount
}

// Nominatim search result type
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    quarter?: string;
    neighbourhood?: string;
    city_district?: string;
    district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    region?: string;
    country?: string;
    postcode?: string;
  };
  type?: string;
}

// Parse Nominatim result into AddressInput components
const parseNominatimResult = (
  result: NominatimResult,
): Partial<AddressInput> => {
  const addr = result.address;
  if (!addr) return {};

  return {
    streetNumber: addr.house_number || "",
    street: addr.road || "",
    ward: addr.suburb || addr.quarter || addr.neighbourhood || "",
    district: addr.city_district || addr.district || "",
    city: addr.city || addr.town || addr.village || "",
    stateRegion: addr.state || addr.region || "",
    country: addr.country || "",
    postalCode: addr.postcode || "",
  };
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  onChange,
  label,
  defaultCenter = [106.6297, 10.8231], // Default to Ho Chi Minh City
  autoDetectLocation = false,
}) => {
  const t = useTranslations("assessment.locationPicker");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const autoDetectDone = useRef(false);

  // Store refs for callbacks to avoid stale closures
  const initialAddressRef = useRef({ lat: address.lat, lng: address.lng });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const addressRef = useRef(address);
  addressRef.current = address;

  // Reverse geocode using Nominatim
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=vi`,
        { headers: { "User-Agent": "WeaveCarbon/1.0" } },
      );
      const data: NominatimResult = await response.json();

      if (data && data.address) {
        const addressParts = parseNominatimResult(data);
        onChangeRef.current({
          ...addressRef.current,
          ...addressParts,
          lat,
          lng,
        });
      } else {
        onChangeRef.current({
          ...addressRef.current,
          lat,
          lng,
        });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      onChangeRef.current({
        ...addressRef.current,
        lat,
        lng,
      });
    }
  }, []);

  // Add or update marker
  const addMarker = useCallback(
    (lng: number, lat: number) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = new mapboxgl.Marker({
        color: "#10b981",
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      marker.on("dragend", async () => {
        const lngLat = marker.getLngLat();
        await reverseGeocode(lngLat.lng, lngLat.lat);
      });

      markerRef.current = marker;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1000,
      });
    },
    [reverseGeocode],
  );

  // Initialize map
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
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        if (initialLat && initialLng) {
          const marker = new mapboxgl.Marker({
            color: "#10b981",
            draggable: true,
          })
            .setLngLat([initialLng, initialLat])
            .addTo(map);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-detect current location on mount (for origin)
  useEffect(() => {
    if (!autoDetectLocation || autoDetectDone.current) return;
    // Only auto-detect if no address has been set yet
    if (address.lat && address.lng) return;

    autoDetectDone.current = true;

    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        // Wait a bit for the map to be ready
        const waitForMap = () => {
          if (mapRef.current) {
            addMarker(longitude, latitude);
            reverseGeocode(longitude, latitude);
            setIsLocating(false);
          } else {
            setTimeout(waitForMap, 200);
          }
        };
        waitForMap();
      },
      (error) => {
        console.error("Auto-detect location error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, [autoDetectLocation, address.lat, address.lng, addMarker, reverseGeocode]);

  // Search for location using Nominatim (OpenStreetMap)
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&accept-language=vi`,
        { headers: { "User-Agent": "WeaveCarbon/1.0" } },
      );
      const data: NominatimResult[] = await response.json();
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const selectLocation = (result: NominatimResult) => {
    const lng = parseFloat(result.lon);
    const lat = parseFloat(result.lat);
    addMarker(lng, lat);

    const addressParts = parseNominatimResult(result);
    onChange({
      ...address,
      ...addressParts,
      lat,
      lng,
    });

    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchLocation(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Get current location (manual button click)
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        addMarker(longitude, latitude);
        await reverseGeocode(longitude, latitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(t("currentLocation"));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".location-search-container")) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          {label}
        </div>

        {/* Search box */}
        <div className="relative location-search-container">
          <div className="flex gap-2">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9 pr-8"
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              disabled={isLocating}
              title={t("currentLocation")}
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
                  onClick={() => selectLocation(result)}
                >
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <span className="line-clamp-2 text-foreground">
                      {result.display_name}
                    </span>
                    {result.address && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {[
                          result.address.city || result.address.town,
                          result.address.state,
                          result.address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showResults &&
            searchResults.length === 0 &&
            searchQuery.length >= 3 &&
            !isSearching && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
              </div>
            )}
        </div>

        {/* Auto-detecting indicator */}
        {isLocating && autoDetectLocation && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2 rounded border border-primary/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t("detectingLocation")}</span>
          </div>
        )}

        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="w-full rounded-lg overflow-hidden border"
          style={{ height: "250px" }}
        />

        {/* Parsed address display */}
        {address.lat && address.lng && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>
                {address.lat.toFixed(6)}, {address.lng.toFixed(6)}
              </span>
              {address.city && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">
                    {[
                      address.street,
                      address.ward,
                      address.district,
                      address.city,
                      address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Click instruction */}
        <p className="text-xs text-muted-foreground">
          💡 {t("mapHint")}
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
