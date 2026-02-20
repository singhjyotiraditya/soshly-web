"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { addTasteListItem, createTasteList, getTasteListsByOwner } from "@/lib/firestore-tastelists";
import { uploadPlacePhotos } from "@/lib/storage";
import Image from "next/image";
import { GeoPoint } from "firebase/firestore";
import { BaseLayout } from "@/components/BaseLayout";
import type { TasteList } from "@/types";

const ADD_PHOTO_STORAGE_KEY = "add-photo-files";

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

export default function AddPlaceWithPhotosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [tastelists, setTastelists] = useState<TasteList[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load photos from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(ADD_PHOTO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setPhotoDataUrls(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-pick first tastelist (don't ask user)
  useEffect(() => {
    if (!user?.uid) return;
    getTasteListsByOwner(user.uid).then((lists) => {
      setTastelists(lists);
    });
  }, [user?.uid]);

  // Current location + reverse geocode for name and address
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation || !token) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&limit=1`
        )
          .then((res) => res.json())
          .then((data) => {
            const feature = data.features?.[0];
            if (!feature) return;
            const props = feature.properties ?? {};
            const fullAddress = (feature.place_name as string) ?? "";
            const name = (props.address_number as string)
              ? `${props.address_number} ${feature.text ?? ""}`.trim()
              : (feature.text as string) ?? fullAddress.split(",")[0] ?? "";
            setAddress(fullAddress);
            if (name && !placeName) setPlaceName(name);
          })
          .catch(() => {
            setAddress("Current location");
            setPlaceName("Current location");
          });
      },
      () => {
        setPlaceName("Unknown location");
        setAddress("Location unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [token]);

  const selectedTastelistId = tastelists.length > 0 ? tastelists[0]!.id : null;

  const handleConfirm = async () => {
    if (!user?.uid || !placeName.trim() || lat == null || lng == null) return;
    setSaving(true);
    try {
      let tasteListId = selectedTastelistId;
      if (!tasteListId) {
        tasteListId = await createTasteList({
          ownerId: user.uid,
          name: "My places",
          description: undefined,
          tags: [],
          privacy: "public",
        });
      }
      const files =
        photoDataUrls.length > 0
          ? photoDataUrls.map((dataUrl, i) => dataURLtoFile(dataUrl, `photo-${i}.jpg`))
          : [];
      const photoUrls =
        files.length > 0
          ? await uploadPlacePhotos(files, user.uid, tasteListId)
          : [];
      await addTasteListItem({
        tasteListId,
        type: "place",
        title: placeName.trim(),
        description: undefined,
        tips: undefined,
        photos: photoUrls,
        geo: new GeoPoint(lat, lng),
        address: address || undefined,
      });
      sessionStorage.removeItem(ADD_PHOTO_STORAGE_KEY);
      router.push(`/tastelists/${tasteListId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    sessionStorage.removeItem(ADD_PHOTO_STORAGE_KEY);
    setPhotoDataUrls([]);
    router.push("/curate");
  };

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;
    const reader = new FileReader();
    const newUrls: string[] = [];
    let index = 0;
    function readNext() {
      if (index >= files.length) {
        setPhotoDataUrls((prev) => {
          const next = [...prev, ...newUrls];
          try {
            sessionStorage.setItem(ADD_PHOTO_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        return;
      }
      reader.onload = () => {
        if (typeof reader.result === "string") newUrls.push(reader.result);
        index++;
        readNext();
      };
      reader.readAsDataURL(files[index]!);
    }
    readNext();
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <p className="text-sm text-white/70">Mapbox token is required for location.</p>
      </div>
    );
  }

  const mainPhoto =
    photoDataUrls.length > 0 ? photoDataUrls[photoDataUrls.length - 1]! : undefined;
  const hasPhoto = !!mainPhoto;

  return (
    <div className="fixed inset-0 z-0 flex min-h-screen flex-col bg-black">
      <BaseLayout className="relative h-full w-full">
        {/* Black overlay box inset from all sides */}
        <div className="absolute top-20 right-6 bottom-65 left-6 z-10 flex flex-col rounded-3xl border border-white/70 border-2 bg-black/75 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
        {/* Photo area (fills middle); location text overlays bottom of image */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl">
          {hasPhoto ? (
            <img
              src={mainPhoto}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900">
              <span className="text-xs text-white/50">No photo</span>
            </div>
          )}
          {/* Location text: on top of image, towards bottom of photo */}
          <div className="absolute bottom-15 left-0 right-0 flex flex-col items-center justify-center bg-black/40 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-xs font-light text-white/95">
              {placeName || "Getting location…"}
            </p>
            {address ? (
              <p className="mt-0.5 text-[11px] font-extralight text-white/80">
                {address}
              </p>
            ) : null}
          </div>
        </div>

        {/* Action bar: delete | confirm (camera) | add photo — absolute at bottom */}
        <div className="absolute -bottom-35 left-0 right-0 flex items-center justify-center gap-8 rounded-b-3xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-12 w-12 items-center justify-center rounded-full border-0 bg-transparent text-white transition hover:bg-white/10 active:opacity-80"
            aria-label="Delete"
          >
            <Image
              src="/bin.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !placeName.trim() || lat == null || lng == null}
            className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30 disabled:opacity-50 disabled:hover:bg-white/20"
            style={{ WebkitBackdropFilter: "blur(12px)" }}
            aria-label="Confirm"
          >
            <svg className="h-11 w-11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleAddPhoto}
            className="flex h-12 w-12 items-center justify-center rounded-full border-0 bg-transparent text-white transition hover:bg-white/10 active:opacity-80"
            aria-label="Add photo"
          >
            <Image
              src="/add-image.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </button>
        </div>
        </div>
      </BaseLayout>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        aria-hidden
        onChange={handlePhotoFiles}
      />
    </div>
  );
}
