"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";

const defaultCenter: [number, number] = [77.209, 30.7041]; // Chandigarh (same as nearby)
const defaultZoom = 50;
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
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);

  // Prevent browser page-zoom on trackpad pinch (wheel + ctrlKey) over the map.
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

  // Get current location and reverse geocode to prefill search box
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation || !token) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setUserCenter([longitude, latitude]);
        setLng(longitude);
        setLat(latitude);
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&limit=1`
        )
          .then((res) => res.json())
          .then((data) => {
            const feature = data.features?.[0];
            if (feature?.place_name) setAddress(feature.place_name as string);
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [token]);

  // Init map — same style and behavior as nearby page
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

    const marker = new mapboxgl.Marker({ color: "#F35100", draggable: true })
      .setLngLat(center)
      .addTo(map);
    marker.on("dragend", () => {
      const { lng: lon, lat: latVal } = marker.getLngLat();
      setLng(lon);
      setLat(latVal);
    });
    markerRef.current = marker;
    mapRef.current = map;
    map.on("load", () => setMapReady(true));
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

  // Center map on user when we get location (same as nearby)
  useEffect(() => {
    if (!mapRef.current || !userCenter) return;
    mapRef.current.setCenter(userCenter);
    mapRef.current.setZoom(13);
    markerRef.current?.setLngLat(userCenter);
  }, [userCenter]);

  // When lat/lng change (search or drag), update map and marker
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
    <div className="flex h-screen flex-col overflow-hidden">
      <PageHeader title="Add Spot" backHref={`/tastelists/${tasteListId}`} />

      {/* Search bar */}
      <div className="shrink-0 px-4 py-2">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <SearchBox
            accessToken={token}
            value={address}
            onChange={(v) => setAddress(v ?? "")}
            onRetrieve={handleRetrieve}
            placeholder="Search address or place…"
            theme={searchBoxTheme}
            options={{
              country: process.env.NEXT_PUBLIC_MAPBOX_COUNTRY ?? "IN",
              proximity:
                lng != null && lat != null
                  ? { lng, lat }
                  : { lng: defaultCenter[0], lat: defaultCenter[1] },
            }}
          />
        </div>
      </div>

      {/* Map — full size, same as nearby with gradient mask */}
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
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <p className="text-sm text-white">Loading map…</p>
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="shrink-0 px-4 pb-6 pt-4">
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
    </div>
  );
}
