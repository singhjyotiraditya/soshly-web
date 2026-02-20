"use client";

import Image from "next/image";

interface ImageUploadAreaProps {
  label?: string;
  onSelectFiles?: (files: File[]) => void;
  className?: string;
}

/** "Add pictures" area: label + large rounded box with add-image icon. Optionally wired to file input. */
export function ImageUploadArea({
  label = "Add pictures",
  onSelectFiles,
  className = "",
}: ImageUploadAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    onSelectFiles?.(files);
    e.target.value = "";
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="mb-1.5 block text-sm font-medium text-white">{label}</label>
      <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-white bg-white/20 transition hover:opacity-90">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleChange}
        />
        <Image
          src="/edit_image.svg"
          alt=""
          width={53}
          height={53}
          className="h-12 w-12 opacity-90"
          aria-hidden
        />
        <span className="mt-2 text-sm text-white/80">Tap to add photos</span>
      </label>
    </div>
  );
}
