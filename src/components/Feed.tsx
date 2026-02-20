"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPublishedExperiences } from "@/lib/firestore-experiences";
import { rankExperiences } from "@/lib/ranking";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import type { Experience } from "@/types";

export function Feed() {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublishedExperiences()
      .then(setExperiences)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const ranked = useMemo(
    () =>
      rankExperiences(experiences, {
        userGeo: user?.geo ?? null,
        userPersona: user?.persona ?? null,
      }),
    [experiences, user?.geo, user?.persona]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-white/90">Loading experiences…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-500/20 p-4 text-white">
        {error}. Ensure Firestore has an index for status + startTime if needed.
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="rounded-lg border border-white/40 bg-white/20 p-8 text-center backdrop-blur-xl">
        <p className="text-white/90">
          No upcoming experiences yet. Create one from a TasteList.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {ranked.map((ex) => (
        <li key={ex.id}>
          <Link
            href={`/experience/${ex.id}`}
            className="block rounded-2xl border border-white/40 bg-white/25 p-4 backdrop-blur-xl transition hover:bg-white/35 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
          >
            <h3 className="font-semibold text-white">
              {ex.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/90">
              {ex.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/80">
              <span>{formatDateTime(ex.startTime)}</span>
              <span>{ex.coinPrice} coins</span>
              <span>{ex.seatsRemaining} seats left</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
