"use client";

import Link from "next/link";
import Image from "next/image";
import type { Experience } from "@/types";

type Props = {
  experience: Experience;
  href?: string;
  className?: string;
  heightClassName?: string;
};

export function ExperienceCoverCard({
  experience,
  href,
  className = "",
  heightClassName = "h-64",
}: Props) {
  const coverSrc =
    experience.cover || `https://picsum.photos/seed/${experience.id}/600/400`;

  return (
    <Link
      href={href ?? `/experience/${experience.id}`}
      className={`relative block w-full overflow-hidden rounded-2xl shadow-lg ${heightClassName} ${className}`}
    >
      <Image
        src={coverSrc}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 448px) 100vw, 448px"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Bottom frosted blur that fades upward (no border) */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "rgba(255, 255, 255, 0.10)",
          backdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
          WebkitBackdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-10">
        <div className="text-center text-white px-6">
          <h3 className="font-gayathri text-2xl">
            {experience.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
            {experience.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

