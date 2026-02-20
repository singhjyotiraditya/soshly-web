"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const defaultCenter = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 12;
const MAP_HEIGHT = 300;

type LatLng = { lat: number; lng: number };

interface MapPickerProps {
  center?: LatLng;
  onSelect?: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

export function MapPicker({
  center = defaultCenter,
  onSelect,
  className = "",
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [marker, setMarker] = useState<LatLng | null>(center);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const position = marker ?? center;

  useEffect(() => {
    if (!containerRef.current || !token) {
      if (!token) setError("Set NEXT_PUBLIC_MAPBOX_TOKEN for map");
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [position.lng, position.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    const m = new mapboxgl.Marker({ color: "#F35100" })
      .setLngLat([position.lng, position.lat])
      .addTo(map);
    markerRef.current = m;
    mapRef.current = map;

    map.on("load", () => setLoading(false));

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setMarker({ lat, lng });
      markerRef.current?.setLngLat([lng, lat]);
      onSelect?.(lat, lng);
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setCenter([position.lng, position.lat]);
    markerRef.current.setLngLat([position.lng, position.lat]);
  }, [position.lat, position.lng]);

  if (!token) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
        style={{ width: "100%", height: MAP_HEIGHT }}
      >
        <p className="text-sm text-zinc-500">
          Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local for map
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 ${className}`}
        style={{ width: "100%", height: MAP_HEIGHT }}
      >
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: MAP_HEIGHT }}
      />
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-100/90 dark:bg-zinc-800/90"
          style={{ height: MAP_HEIGHT }}
        >
          <p className="text-sm text-zinc-500">Loading map…</p>
        </div>
      )}
    </div>
  );
}
