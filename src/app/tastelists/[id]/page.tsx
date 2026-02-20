"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTasteList,
  getTasteListItems,
  getPlaceItemsFromOtherTastelists,
  updateTasteList,
} from "@/lib/firestore-tastelists";
import { CREW_PERSONAS, getCrewPersonaFromPersona } from "@/lib/personas";
import { BottomSheet } from "@/components/BottomSheet";
import { PageHeader } from "@/components/PageHeader";
import { TextInput } from "@/components/ui/TextInput";
import type { TasteList, TasteListItem } from "@/types";

export default function TasteListDetailPage() {
  const params = useParams();
  const { user, loading: authLoading, firebaseUser } = useAuth();
  const id = params.id as string;
  const [list, setList] = useState<TasteList | null>(null);
  const [items, setItems] = useState<TasteListItem[]>([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState<TasteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userDataLoading = authLoading || (!!firebaseUser && user === null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTasteList(id)
      .then((l) => {
        setList(l ?? null);
        if (l) return getTasteListItems(l.id);
        return [];
      })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (userDataLoading) {
      setRecommendedPlaces([]);
      return;
    }
    getPlaceItemsFromOtherTastelists(user?.uid ?? null, 12)
      .then(setRecommendedPlaces)
      .catch(() => setRecommendedPlaces([]));
  }, [userDataLoading, user?.uid]);

  useEffect(() => {
    if (list) {
      setEditName(list.name);
      setEditDescription(list.description ?? "");
    }
  }, [list]);

  const crewName =
    user?.persona != null
      ? CREW_PERSONAS[getCrewPersonaFromPersona(user.persona)].name
      : "IZU";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/90">Loading…</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-white/90">TasteList not found.</p>
        <Link href="/tastelists" className="text-white underline">
          Back to lists
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === list.ownerId;

  const openSheet = () => {
    setEditName(list.name);
    setEditDescription(list.description ?? "");
    setSheetOpen(true);
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", `tastelists/${id}/cover`);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { success?: boolean; imgUrl?: string };
      if (!res.ok || !data.imgUrl) throw new Error("Upload failed");
      await updateTasteList(id, { coverImage: data.imgUrl });
      setList((prev) => (prev ? { ...prev, coverImage: data.imgUrl } : null));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTasteList(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setList((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              description: editDescription.trim() || undefined,
            }
          : null
      );
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Build your Taste" backHref="/curate" />

      <main className="mx-auto max-w-md px-6 pt-6">
        {/* Cover image placeholder */}
        <div
          className="relative aspect-[4/3.5] overflow-hidden rounded-2xl border border-white/70"
          style={{
            background:
              "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
          }}
        >
          {list.coverImage ? (
            <Image src={list.coverImage} alt="" fill className="object-cover" />
          ) : null}
          {isOwner && (
            <button
              type="button"
              onClick={openSheet}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/50 text-white"
              aria-label="Edit cover"
            >
              <Image
                src="/edit.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </button>
          )}
        </div>

        {/* Taste list name */}
        <h1 className="mt-4 text-center text-2xl font-semibold text-white">
          {list.name}
        </h1>

        {/* Add Place button */}
        {isOwner && (
          <Link
            href={`/tastelists/${id}/add-place`}
            className="mt-4 flex w-full items-center justify-start gap-1 rounded-[15px] border border-gray-100 bg-white/20 py-2.5 pl-4 pr-4 text-white backdrop-blur-sm transition active:scale-[0.98]"
          >
            <span className="text-3xl font-light leading-none">+</span>
            Add Place
          </Link>
        )}

        {/* Places from other owners' tastelists */}
        {recommendedPlaces.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-medium text-white">
            {crewName} recommend places for you
          </h2>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {recommendedPlaces.map((place) => {
              const geo = place.geo as { latitude?: number; longitude?: number } | undefined;
              const lat = geo?.latitude ?? (geo as { lat?: number })?.lat;
              const lng = geo?.longitude ?? (geo as { lng?: number })?.lng;
              const hasGeo = typeof lat === "number" && typeof lng === "number";
              const href = hasGeo
                ? `/tastelists/${id}/add-place/details?lat=${lat}&lng=${lng}&address=${encodeURIComponent(place.address ?? "")}&title=${encodeURIComponent(place.title)}`
                : `/tastelists/${id}/add-place`;
              const cover = place.photos?.[0] ?? `https://picsum.photos/seed/${place.id}/300/400`;
              return (
                <Link
                  key={place.id}
                  href={href}
                  className="relative block h-44 w-36 shrink-0 overflow-hidden rounded-2xl"
                >
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="font-medium">{place.title}</p>
                    <p className="text-xs opacity-90">{place.address ?? ""}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        )}

        {/* Listed items */}
        {items.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-base font-medium text-white">
              Your places ({items.length})
            </h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-white/40 bg-white/20 p-4 backdrop-blur-xl"
                >
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/80">
                    {item.description ?? item.address ?? item.type}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Edit bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="flex gap-4">
          {/* Cover preview - click to add image */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{
              background:
                "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
            }}
          >
            {list.coverImage && (
              <Image
                src={list.coverImage}
                alt=""
                fill
                className="object-cover"
              />
            )}
            {uploading ? (
              <span className="relative z-10 text-sm text-white">
                Uploading…
              </span>
            ) : (
              <Image
                src="/edit_image.svg"
                alt=""
                width={28}
                height={28}
                className="relative z-10 h-7 w-7"
              />
            )}
          </button>
          {/* Save / Cancel */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-[14px] bg-black px-14 py-3 text-sm font-medium text-white transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-sm text-white"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="mb-3 text-md font-medium text-white">
            Name and details
          </h3>
          <div className="space-y-3">
            <TextInput
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Cafe Clicks"
              inputClassName="py-3"
            />
            <TextInput
              id="edit-description"
              multiline
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
              inputClassName="min-h-[80px]"
            />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
