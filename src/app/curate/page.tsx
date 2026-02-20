"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionCard } from "@/components/ActionCard";
import { PageHeader } from "@/components/PageHeader";

const ADD_PHOTO_STORAGE_KEY = "add-photo-files";

export default function CuratePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;
    const reader = new FileReader();
    const dataUrls: string[] = [];
    let index = 0;
    function readNext() {
      if (index >= files.length) {
        try {
          sessionStorage.setItem(ADD_PHOTO_STORAGE_KEY, JSON.stringify(dataUrls));
          router.push("/add-place-with-photos");
        } catch {
          // quota or parse
        }
        return;
      }
      reader.onload = () => {
        if (typeof reader.result === "string") dataUrls.push(reader.result);
        index++;
        readNext();
      };
      reader.readAsDataURL(files[index]!);
    }
    readNext();
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Curate your Taste" backHref="/dashboard" />

      <main className="mx-auto max-w-md px-4 pt-6">
        <p className="mb-6 text-center text-sm font-semibold text-white/90">
          What do you want to make live?
        </p>

        <div className="space-y-4">
          <ActionCard
            title="Create a Taste List"
            description="Share your favorite spots"
            href="/tastelists/new"
          />
          <ActionCard
            title="Host an Experience"
            description="Turn your list into a guided experience & earn"
            href="/experience/select-list"
          />
        </div>
      </main>

      {/* Bottom camera FAB - opens camera, then add-place-with-photos */}
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
      <div className="fixed bottom-28 left-0 right-0 z-40 flex justify-center">
        <button
          type="button"
          onClick={handleCameraClick}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 transition active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.08), inset 0 0 24px 8px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
          aria-label="Take photos and add place"
        >
          <Image
            src="/camera.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
        </button>
      </div>
    </div>
  );
}
