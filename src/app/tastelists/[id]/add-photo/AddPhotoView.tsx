"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBox } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { useAuth } from "@/contexts/AuthContext";
import { addTasteListItem } from "@/lib/firestore-tastelists";
import { uploadPlacePhotos } from "@/lib/storage";
import { GeoPoint } from "firebase/firestore";
import { BaseLayout } from "@/components/BaseLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

const ADD_PHOTO_STORAGE_KEY = "add-photo-files";
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

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

interface AddPhotoViewProps {
  tasteListId: string;
  token: string;
}

export default function AddPhotoView({ tasteListId, token }: AddPhotoViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(ADD_PHOTO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setPhotoDataUrls(parsed);
        sessionStorage.removeItem(ADD_PHOTO_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

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
    if (name && !placeName) setPlaceName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !placeName.trim()) return;
    if (lat == null || lng == null) return;
    setSaving(true);
    try {
      const files =
        photoDataUrls.length > 0
          ? photoDataUrls.map((dataUrl, i) =>
              dataURLtoFile(dataUrl, `photo-${i}.jpg`)
            )
          : [];
      const photoUrls =
        files.length > 0
          ? await uploadPlacePhotos(files, user.uid, tasteListId)
          : [];
      await addTasteListItem({
        tasteListId,
        type: "place",
        title: placeName.trim(),
        description: description.trim() || undefined,
        tips: undefined,
        photos: photoUrls,
        geo: new GeoPoint(lat, lng),
        address: address || undefined,
      });
      router.push(`/tastelists/${tasteListId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <BaseLayout className="flex min-h-screen w-full flex-col px-4 pb-8 pt-2">
        <PageHeader
          title="Add place"
          backHref={`/tastelists/${tasteListId}`}
        />

        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col gap-4">
          <div className="relative z-10 rounded-xl bg-white/10 backdrop-blur-md">
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
                    : { lng: defaultCenter.lng, lat: defaultCenter.lat },
              }}
            />
          </div>

          <FormField
            label="Name of the place"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="e.g. Café Picante"
            required
          />

          <FormField
            label="Description (optional)"
            multiline
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Great coffee, quiet spot"
            rows={3}
          />

          {photoDataUrls.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-white">
                Photos ({photoDataUrls.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photoDataUrls.map((dataUrl, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/10"
                  >
                    <img
                      src={dataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={saving || !placeName.trim() || lat == null || lng == null}
            >
              {saving ? "Saving…" : "Add to list"}
            </Button>
          </div>
        </form>
      </BaseLayout>
    </div>
  );
}
