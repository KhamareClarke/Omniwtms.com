// @ts-nocheck
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface WarehouseLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  location: string;
}

interface WarehouseMapProps {
  locations: WarehouseLocation[];
}

export const WarehouseMap: React.FC<WarehouseMapProps> = ({ locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Create the map only once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    fixLeafletIcon();
    const getValidCoords = (coords: any): [number, number] => {
      if (
        Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        return [coords[0], coords[1]];
      }
      return [51.5074, -0.1278];
    };
    const center: [number, number] =
      locations.length > 0
        ? getValidCoords(locations[0].coordinates)
        : [51.5074, -0.1278];
    const map = L.map(mapRef.current).setView(center, 4);
    leafletMapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const getValidCoords = (coords: any): [number, number] => {
      if (
        Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        return [coords[0], coords[1]];
      }
      return [51.5074, -0.1278];
    };
    locations.forEach((loc) => {
      const coords: [number, number] = getValidCoords(loc.coordinates);
      const marker = L.marker(coords)
        .addTo(leafletMapRef.current!)
        .bindPopup(`<b>${loc.name}</b><br/>${loc.location}`);
      markersRef.current.push(marker);
    });
    // Optionally fit bounds
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map((loc) => getValidCoords(loc.coordinates))
      );
      leafletMapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [locations]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[250px] sm:h-[350px] rounded-lg z-0"
      style={{ minHeight: 200 }}
    />
  );
};
