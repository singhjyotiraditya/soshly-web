"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { addTasteListItem } from "@/lib/firestore-tastelists";
import { uploadPlacePhotos } from "@/lib/storage";
import { GeoPoint } from "firebase/firestore";
import { BaseLayout } from "@/components/BaseLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { LocationDisplayField } from "@/components/ui/LocationDisplayField";
import { FormField } from "@/components/ui/FormField";
import { ImageUploadArea } from "@/components/ui/ImageUploadArea";

export default function AddPlaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tasteListId = params.id as string;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const addressParam = searchParams.get("address") ?? "";
  const lat = latParam != null ? Number(latParam) : null;
  const lng = lngParam != null ? Number(lngParam) : null;

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSelectFiles = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !title.trim()) return;
    if (lat == null || lng == null) {
      router.push(`/tastelists/${tasteListId}/add-place`);
      return;
    }
    setSaving(true);
    try {
      const photoUrls =
        selectedFiles.length > 0
          ? await uploadPlacePhotos(selectedFiles, user.uid, tasteListId)
          : [];
      await addTasteListItem({
        tasteListId,
        type: "place",
        title: title.trim(),
        description: note.trim() || undefined,
        tips: undefined,
        photos: photoUrls,
        geo: new GeoPoint(lat, lng),
        address: addressParam || undefined,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (lat == null || lng == null) {
    return (
      <div className="min-h-screen">
        <BaseLayout className="px-4 py-6">
          <PageHeader title="Add Details" backHref={`/tastelists/${tasteListId}`} />
          <p className="mb-4 text-[#1e3a5f]">No location selected.</p>
          <Button
            variant="secondary"
            onClick={() => router.push(`/tastelists/${tasteListId}/add-place`)}
          >
            Choose location
          </Button>
        </BaseLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BaseLayout className="flex min-h-screen flex-col px-4 pb-8 pt-2">
        <PageHeader
          title="Add Details"
          backHref={`/tastelists/${tasteListId}/add-place`}
        />

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 mt-4">
          <LocationDisplayField address={addressParam} />

          <FormField
            label="Name of the place"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Café Zoe, Bandra West"
            required
          />

          <FormField
            label="Note for the place"
            multiline
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. The almond croissant here is life changing. Sit by the window for a great view."
            rows={4}
          />

          <ImageUploadArea
            className="mt-2"
            onSelectFiles={handleSelectFiles}
          />
          {selectedFiles.length > 0 && (
            <p className="text-sm text-white/80">
              {selectedFiles.length} photo{selectedFiles.length !== 1 ? "s" : ""} selected
            </p>
          )}

          <div className="mt-auto pt-6">
            <Button type="submit" variant="secondary" fullWidth disabled={saving}>
              {saving ? "Saving…" : "Done"}
            </Button>
          </div>
        </form>
      </BaseLayout>
    </div>
  );
}
