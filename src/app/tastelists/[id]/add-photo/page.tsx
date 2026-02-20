"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { addTasteListItem } from "@/lib/firestore-tastelists";
import { MapPicker } from "@/components/MapPicker";
import { GeoPoint } from "firebase/firestore";

export default function AddPhotoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tasteListId = params.id as string;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMapSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !title.trim()) return;
    setSaving(true);
    try {
      await addTasteListItem({
        tasteListId,
        type: "post",
        title: title.trim(),
        description: description.trim() || undefined,
        photos: photoDataUrl ? [photoDataUrl] : [],
        ...(lat != null && lng != null ? { geo: new GeoPoint(lat, lng) } : {}),
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/tastelists/${tasteListId}`}
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Soshly
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Add place (camera)
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Photo
            </label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="w-full text-sm text-zinc-600 dark:text-zinc-400"
            />
            {photoDataUrl && (
              <img
                src={photoDataUrl}
                alt="Preview"
                className="mt-2 h-40 w-full rounded-lg object-cover"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Location (optional)
            </label>
            <MapPicker onSelect={handleMapSelect} />
          </div>
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Post title"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Caption
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <Link
              href={`/tastelists/${tasteListId}`}
              className="rounded-full border border-zinc-300 px-6 py-3 font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
