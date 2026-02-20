"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { Button } from "@/components/ui/Button";
import { BaseLayout } from "@/components/BaseLayout";
import { PageHeader } from "@/components/PageHeader";

const defaultCenter = { lat: 40.7128, lng: -74.006 };

const searchBoxTheme = {
  variables: {
    colorBackground: "rgba(255, 255, 255, 0.85)",
    borderRadius: "0.75rem",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 1px 2px rgba(255,255,255,0.2)",
    padding: "0.75rem 1rem",
    unit: "14px",
    fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
};

interface AddPlaceViewProps {
  tasteListId: string;
  token: string;
}

export default function AddPlaceView({ tasteListId, token }: AddPlaceViewProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [mapReady, setMapReady] = useState(false);

  // Prevent browser page-zoom on trackpad pinch (wheel + ctrlKey) over the map.
  // We do NOT block normal wheel events so Mapbox scroll-zoom works.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      const el = containerRef.current;
      const target = e.target as Node | null;
      if (!el || !target || !el.contains(target)) return;
      e.preventDefault();
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Ask for browser location on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        // User denied or unavailable; keep default center
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || !token) return;
    mapboxgl.accessToken = token;
    const center = lng != null && lat != null ? [lng, lat] : [defaultCenter.lng, defaultCenter.lat];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center as [number, number],
      zoom: 12,
      attributionControl: false,
      scrollZoom: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      dragPan: true,
    });

    // Prevent browser page zoom/scroll when interacting with the map.
    // `touch-action` does not inherit, so apply it to the actual canvas/container.
    map.getCanvas().style.touchAction = "none";
    map.getCanvasContainer().style.touchAction = "none";

    const marker = new mapboxgl.Marker({ color: "#F35100", draggable: true })
      .setLngLat(center as [number, number])
      .addTo(map);
    marker.on("dragend", () => {
      const { lng: lon, lat: latVal } = marker.getLngLat();
      setLng(lon);
      setLat(latVal);
    });
    markerRef.current = marker;
    mapRef.current = map;
    map.on("load", () => {
      // Be explicit: ensure all interactions are enabled.
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.touchZoomRotate.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.dragRotate.enable();
      setMapReady(true);
    });
    map.on("click", (e) => {
      const { lng: lon, lat: latVal } = e.lngLat;
      setLng(lon);
      setLat(latVal);
      markerRef.current?.setLngLat([lon, latVal]);
    });
    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat == null || lng == null) return;
    mapRef.current.setCenter([lng, lat]);
    mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
    markerRef.current.setLngLat([lng, lat]);
  }, [lat, lng]);

  const handleRetrieve = (res: SearchBoxRetrieveResponse) => {
    const feature = res?.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!coords || typeof coords[0] !== "number" || typeof coords[1] !== "number") return;
    const lon = coords[0];
    const latVal = coords[1];
    setLng(lon);
    setLat(latVal);
    const props = feature.properties ?? {};
    const name = (props.name as string) ?? "";
    const fullAddr = (props.full_address as string) ?? "";
    setAddress([name, fullAddr].filter(Boolean).join(", "));
  };

  const goToDetails = () => {
    if (lat == null || lng == null) return;
    const q = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (address) q.set("address", address);
    router.push(`/tastelists/${tasteListId}/add-place/details?${q.toString()}`);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <BaseLayout className="flex min-h-screen w-full flex-col">
        {/* Top bar — higher z-index so search box and dropdown sit above map */}
        <div className="relative z-10 px-3 pb-3 backdrop-blur-sm">
          <PageHeader title="Add Spot" backHref={`/tastelists/${tasteListId}`} />
          <div className="relative z-10 mt-3 rounded-xl bg-white/10 backdrop-blur-md">
            <SearchBox
              accessToken={token}
              value={address}
              onChange={(v) => setAddress(v ?? "")}
              onRetrieve={handleRetrieve}
              placeholder="Search address or place…"
              theme={searchBoxTheme}
              options={{
                proximity: lng != null && lat != null ? { lng, lat } : undefined,
              }}
            />
          </div>
        </div>

        {/* Map container (contained card) — z-0 so top bar stays on top */}
        <div className="relative z-0 px-4 py-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/5 backdrop-blur-sm">
            <div
              ref={containerRef}
              className="h-[72vh] min-h-[420px] w-full"
            />
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80">
                <p className="text-sm text-zinc-500">Loading map…</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div className="sticky bottom-0 z-20 px-4 pb-6 pt-4">
          <Button
            type="button"
            variant="primary"
            fullWidth
            leftIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            onClick={goToDetails}
            disabled={lat == null || lng == null}
            className="shadow-lg"
          >
            Add details
          </Button>
        </div>
      </BaseLayout>
    </div>
  );
}
