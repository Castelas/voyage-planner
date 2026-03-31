/// <reference types="@types/google.maps" />
import { useEffect, useRef, useCallback } from "react";
import { MapView } from "@/components/Map";
import type { RouterOutputs } from "@/lib/trpc";

type Attraction = RouterOutputs["attractions"]["listByTrip"][number];

interface SiciliaMapProps {
  attractions: Attraction[];
  selectedAttractionId?: number | null;
  selectedDayAttractions?: Attraction[];
  directionsPolyline?: string | null;
  onAttractionClick?: (attraction: Attraction) => void;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10b981", // emerald
  idea: "#f59e0b",      // amber
};

const SELECTED_COLOR = "#3b82f6"; // blue

export function SiciliaMap({
  attractions,
  selectedAttractionId,
  selectedDayAttractions,
  directionsPolyline,
  onAttractionClick,
  className,
}: SiciliaMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Sicily center
  const SICILY_CENTER = { lat: 37.6, lng: 14.0 };

  const createMarkerContent = useCallback((attraction: Attraction, isSelected: boolean) => {
    const statusKey = (attraction.status as keyof typeof STATUS_COLORS) || "idea";
    const color = isSelected ? SELECTED_COLOR : STATUS_COLORS[statusKey];
    const div = document.createElement("div");
    div.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
        transition: transform 0.2s;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: ${color};
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 14px;
            font-weight: bold;
          ">${attraction.status === "confirmed" ? "✓" : "★"}</div>
        </div>
      </div>
    `;
    return div;
  }, []);

  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const currentIds = new Set(attractions.map((a) => a.id));

    // Remove markers for deleted attractions
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.map = null;
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    attractions.forEach((attraction) => {
      if (!attraction.lat || !attraction.lng) return;
      const isSelected = attraction.id === selectedAttractionId;
      const existing = markersRef.current.get(attraction.id);

      if (existing) {
        existing.content = createMarkerContent(attraction, isSelected);
        existing.position = { lat: attraction.lat, lng: attraction.lng };
      } else {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: attraction.lat, lng: attraction.lng },
          title: attraction.name,
          content: createMarkerContent(attraction, isSelected),
        });

        marker.addListener("click", () => {
          onAttractionClick?.(attraction);

          // Show InfoWindow
          if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow();
          }
          const content = `
            <div style="font-family: Inter, sans-serif; padding: 8px; max-width: 200px;">
              ${attraction.photoUrl ? `<img src="${attraction.photoUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:8px;" onerror="this.style.display='none'" />` : ""}
              <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${attraction.name}</div>
              ${attraction.address ? `<div style="font-size:11px;color:#666;margin-bottom:4px;">📍 ${attraction.address}</div>` : ""}
              ${attraction.rating ? `<div style="font-size:11px;color:#f59e0b;">⭐ ${attraction.rating.toFixed(1)}</div>` : ""}
              ${attraction.description ? `<div style="font-size:12px;color:#444;margin-top:6px;">${attraction.description.slice(0, 100)}${attraction.description.length > 100 ? "..." : ""}</div>` : ""}
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapRef.current, marker);
        });

        markersRef.current.set(attraction.id, marker);
      }
    });
  }, [attractions, selectedAttractionId, createMarkerContent, onAttractionClick]);

  // Draw directions polyline
  const drawDirections = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Clear existing
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!directionsPolyline || !selectedDayAttractions || selectedDayAttractions.length < 2) return;

    // Decode and draw polyline
    const path = window.google.maps.geometry?.encoding?.decodePath(directionsPolyline);
    if (path) {
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapRef.current,
      });
    }
  }, [directionsPolyline, selectedDayAttractions]);

  // Fit map to day attractions
  const fitToDayAttractions = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    if (!selectedDayAttractions || selectedDayAttractions.length === 0) return;

    const withCoords = selectedDayAttractions.filter((a) => a.lat && a.lng);
    if (withCoords.length === 0) return;

    if (withCoords.length === 1) {
      mapRef.current.setCenter({ lat: withCoords[0].lat!, lng: withCoords[0].lng! });
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    withCoords.forEach((a) => bounds.extend({ lat: a.lat!, lng: a.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [selectedDayAttractions]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    drawDirections();
  }, [drawDirections]);

  useEffect(() => {
    if (selectedDayAttractions && selectedDayAttractions.length > 0) {
      fitToDayAttractions();
    }
  }, [selectedDayAttractions, fitToDayAttractions]);

  // Pan to selected attraction
  useEffect(() => {
    if (!mapRef.current || !selectedAttractionId) return;
    const attr = attractions.find((a) => a.id === selectedAttractionId);
    if (attr?.lat && attr?.lng) {
      mapRef.current.panTo({ lat: attr.lat, lng: attr.lng });
    }
  }, [selectedAttractionId, attractions]);

  return (
    <MapView
      className={className}
      initialCenter={SICILY_CENTER}
      initialZoom={9}
      onMapReady={handleMapReady}
    />
  );
}
