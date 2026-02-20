"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getPublishedExperiences } from "@/lib/firestore-experiences";
import type { Experience } from "@/types";

const defaultCenter: [number, number] = [77.209, 30.7041]; // Chandigarh
const defaultZoom = 50;
const MAX_KM = 100;

/** Distance in km between two [lng, lat] points (Haversine). */
function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371; // Earth radius in km
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getLngLat(exp: Experience): [number, number] | null {
  const geo = exp.location?.geo;
  if (!geo || typeof geo !== "object") return null;
  const lat =
    typeof (geo as { latitude?: number }).latitude === "number"
      ? (geo as { latitude: number }).latitude
      : (geo as { lat?: number }).lat;
  const lng =
    typeof (geo as { longitude?: number }).longitude === "number"
      ? (geo as { longitude: number }).longitude
      : (geo as { lng?: number }).lng;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lng, lat];
}

export default function NearbyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Only show experiences within MAX_KM of user; when no position yet, show none
  const nearbyExperiences =
    userCenter == null
      ? []
      : experiences.filter((exp) => {
          const lngLat = getLngLat(exp);
          return lngLat != null && distanceKm(userCenter, lngLat) <= MAX_KM;
        });

  // Load published experiences with geo
  useEffect(() => {
    getPublishedExperiences(100)
      .then((list) => {
        const withGeo = list.filter((e) => getLngLat(e) != null);
        setExperiences(withGeo);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Optional: get user location for initial center
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCenter([
          position.coords.longitude,
          position.coords.latitude,
        ]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current || !token) return;
    mapboxgl.accessToken = token;
    const center = userCenter ?? defaultCenter;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom: defaultZoom,
      attributionControl: false,
    });
    map.getCanvas().style.touchAction = "none";
    map.getCanvasContainer().style.touchAction = "none";
    map.on("load", () => setMapReady(true));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Center map on user when we get location
  useEffect(() => {
    if (!mapRef.current || !userCenter) return;
    mapRef.current.setCenter(userCenter);
    mapRef.current.setZoom(13);
  }, [userCenter]);

  // Current location marker
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    userLocationMarkerRef.current?.remove();
    userLocationMarkerRef.current = null;
    if (!userCenter) return;
    const el = document.createElement("div");
    el.setAttribute("aria-label", "Your location");
    el.style.cssText = `
      width: 20px;
      height: 20px;
      background: #2563eb;
      border: 3px solid rgba(255,255,255,0.95);
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    `;
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(userCenter)
      .addTo(mapRef.current!);
    userLocationMarkerRef.current = marker;
  }, [mapReady, userCenter]);

  // Add markers when map is ready and experiences are loaded (only nearby)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    nearbyExperiences.forEach((exp) => {
      const lngLat = getLngLat(exp);
      if (!lngLat) return;
      const el = document.createElement("div");
      el.className = "nearby-marker";
      el.setAttribute("aria-label", exp.title);
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #F35100 0%, #FE9764 100%);
        border: 2px solid rgba(255,255,255,0.9);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        pointer-events: auto;
        z-index: 1;
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        router.push(`/experience/${exp.id}`);
      });
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
      markersRef.current.push(marker);
    });
    map.resize();
  }, [mapReady, nearbyExperiences, router]);

  if (!token) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Nearby" backHref="/dashboard" />
        <main className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-white/80">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to show the map.
          </p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <PageHeader title="Nearby" backHref="/dashboard" />
      <div className="shrink-0 flex justify-center px-4 py-2">
        <div className="w-fit max-w-[200px] rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md">
          <p className="text-xs text-white/90">
            {nearbyExperiences.length} experience{nearbyExperiences.length !== 1 ? "s" : ""} nearby
          </p>
        </div>
      </div>
      <main className="relative min-h-0 flex-1 w-full overflow-hidden" style={{ minHeight: 0 }}>
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%)",
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <p className="text-sm text-white">Loading experiences…</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
