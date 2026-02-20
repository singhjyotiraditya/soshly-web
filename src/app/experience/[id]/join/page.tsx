"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getExperience } from "@/lib/firestore-experiences";
import { PageHeader } from "@/components/PageHeader";
import { BaseLayout } from "@/components/BaseLayout";
import type { Experience } from "@/types";

const PREFERENCES = [
  { id: "pure_vegan", label: "Pure Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "non_vegetarian", label: "Non-Vegetarian" },
  { id: "no_caffeine", label: "No Caffeine" },
  { id: "no_dessert", label: "No Dessert" },
] as const;

function formatDateShort(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${weekday}, ${day} ${month}`;
}

function formatTimeRange(startIso: string | undefined, endIso: string | undefined, durationMin: number): string {
  if (!startIso) return "—";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "—";
  const end = endIso
    ? new Date(endIso)
    : new Date(start.getTime() + (durationMin || 60) * 60 * 1000);
  const fmt = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}${ampm}`;
  };
  return `${fmt(start)} to ${fmt(end)}`;
}

export default function JoinExperiencePage() {
  const params = useParams();
  const id = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getExperience(id)
      .then(setExperience)
      .finally(() => setLoading(false));
  }, [id]);

  const togglePreference = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProceed = () => {
    setJoining(true);
    // TODO: call join API (create ticket, escrow coins), then redirect
    setTimeout(() => setJoining(false), 500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2563eb]">
        <p className="text-white">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#2563eb]">
        <p className="text-white">Experience not found.</p>
        <Link href="/dashboard" className="text-white underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const venue = experience.meetingPoint || experience.location?.address || "";
  const dateStr = formatDateShort(experience.startTime);
  const timeStr = formatTimeRange(
    experience.startTime,
    experience.endTime,
    experience.duration ?? 60
  );
  const locationStr = experience.meetingPoint || experience.location?.address || "—";

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Join this Experience" backHref={`/experience/${id}`} />

      <BaseLayout className="px-4 pt-2">
        {/* Experience summary card (frosted) */}
        <div className="rounded-2xl border border-white/30 bg-white/20 p-0 shadow-lg backdrop-blur-md">
          <div className="overflow-hidden rounded-t-2xl">
            {experience.cover ? (
              <div className="relative aspect-4/3 w-full">
                <Image
                  src={experience.cover}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="aspect-4/3 w-full rounded-t-2xl"
                style={{
                  background:
                    "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                }}
              />
            )}
          </div>
          <div className="p-4">
            <h2 className="font-gayathri text-2xl font-bold tracking-tight text-white">
              {experience.title}
            </h2>
            {venue ? (
              <p className="mt-1 text-sm text-white/80">{venue}</p>
            ) : null}
            <p className="mt-1 text-xs text-white/60">
              Hosted by: Host
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Social", "Chill", "Playful"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/60 px-3 py-1 text-xs font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm text-white">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span>{dateStr}</span>
                <span className="text-white/50">•</span>
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span>{timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 shrink-0 text-red-300" />
                <span>{locationStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anything we should know? */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold text-white">
            Anything we should know?
          </h3>
          <p className="mt-1 text-sm italic text-white/70">
            *Preferences are shared with the host to help the experience go
            smoothly.
          </p>
          <ul className="mt-3 space-y-2">
            {PREFERENCES.map(({ id: key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!preferences[key]}
                    onChange={() => togglePreference(key)}
                    className="h-5 w-5 rounded border-2 border-white/60 bg-transparent text-white focus:ring-2 focus:ring-white/50"
                  />
                  <span className="text-white">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Experience Contribution */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-white">
            Experience Contribution
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Covers the full curated experience, including food, drinks, and
            activities.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <CoinIcon className="h-6 w-6 shrink-0 text-white/90" />
            <span className="text-lg font-bold text-white">
              {experience.coinPrice} Coins per person
            </span>
          </div>
          <p className="mt-2 text-xs text-white/60">
            *Coins are created only for this experience. If it&apos;s cancelled,
            they&apos;ll stay in your wallet to use later.
          </p>
        </section>
      </BaseLayout>

      {/* Proceed to Join */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleProceed}
            disabled={joining}
            className="w-full rounded-2xl bg-zinc-900 px-5 py-4 text-lg font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
          >
            {joining ? "Joining…" : "Proceed to Join"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="14" height="14" rx="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v4l3 2" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 10.833a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M10 2.5C6.36 2.5 3.5 5.82 3.5 9.5c0 4.5 6 8.167 6.5 8.167.5 0 6.5-3.667 6.5-8.167C16.5 5.82 13.64 2.5 10 2.5Z" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12M9 9a6 6 0 0 0 6 0M9 15a6 6 0 0 1 6 0" />
    </svg>
  );
}
