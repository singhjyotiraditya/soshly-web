"use client";

import Image from "next/image";

interface LocationDisplayFieldProps {
  address: string;
  className?: string;
}

function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-white/90"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Read-only location/address with icon beside address. Use on Add Details–style screens. */
export function LocationDisplayField({ address, className = "" }: LocationDisplayFieldProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[14px] border border-white bg-white/20 px-4 py-3 ${className}`}
    >
      <Image
        src="/nav/location_fill.svg"
        alt=""
        width={20}
        height={20}
        className="h-6 w-6 shrink-0"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-md font-medium text-white">
        {address.trim().length > 0 ? address : "No address"}
      </span>
    </div>
  );
}
