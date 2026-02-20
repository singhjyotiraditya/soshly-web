"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getExperience } from "@/lib/firestore-experiences";
import { getUser } from "@/lib/firestore-users";
import { getBalance, joinExperience } from "@/lib/firestore-wallet";
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
  const { user } = useAuth();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getExperience(id).then((exp) => {
      setExperience(exp);
      if (exp?.hostId) {
        getUser(exp.hostId).then((u) => {
          const name =
            u?.nickname ||
            u?.fullName?.split(" ")[0] ||
            u?.username ||
            "Host";
          setHostName(name);
        });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user?.uid) return;
    getBalance(user.uid).then(setWalletBalance);
  }, [user?.uid]);

  const togglePreference = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProceed = async () => {
    if (!user?.uid || !experience) return;
    setError(null);
    setJoining(true);
    try {
      await joinExperience(id, user.uid);
      const newBalance = await getBalance(user.uid);
      setWalletBalance(newBalance);
      router.push(`/experience/${id}/ticket`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
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
      <PageHeader
        title="Join this Experience"
        backHref={`/experience/${id}`}
        rightContent={
          <div className="flex flex-col items-center gap-0.5">
            <Image
              src="/coins.svg"
              alt=""
              width={28}
              height={28}
              className="h-6 w-6"
            />
            <span className="text-base font-semibold text-white tabular-nums">
              {walletBalance ?? 0}
            </span>
          </div>
        }
      />

      <BaseLayout className="px-4 pt-2">
        {/* Experience summary card (frosted) */}
        <div className="rounded-2xl border border-white/60 p-4 shadow-[inset_0_0_60px_40px_rgba(255,255,255,0.2)] backdrop-blur-md">
          <div className="overflow-hidden rounded-xl">
            {experience.cover ? (
              <div className="relative aspect-4/3 w-full">
                <Image
                  src={experience.cover}
                  alt=""
                  fill
                  className="object-cover"
                  loading="eager"
                />
              </div>
            ) : (
              <div
                className="aspect-4/3 w-full"
                style={{
                  background:
                    "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                }}
              />
            )}
          </div>
          <div className="pt-4 text-center">
            <h2 className="font-gayathri text-2xl font-bold tracking-tight text-white">
              {experience.title}
            </h2>
            {venue ? (
              <p className="mt-1 text-sm text-white/80">{venue}</p>
            ) : null}
            <p className="mt-1 text-xs text-white/60">
              Hosted by: {hostName ?? "…"}
            </p>
            <div className="mx-auto my-4 w-3/4 border-t border-white/40" aria-hidden />
            <div className="flex flex-col items-center gap-2 text-sm text-white">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>{'📆 ' + dateStr}</span>
                <span className="text-white/50">•</span>
                <span>{'🕕 ' + timeStr}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>{'📍 ' + locationStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anything we should know? */}
        <section className="mt-6">
          <h3 className="text-lg font-medium text-white">
            Anything we should know?
          </h3>
          <p className="text-sm text-white/70">
            *Preferences are shared with the host to help the experience go
            smoothly.
          </p>
          <ul className="mt-3 space-y-2">
            {PREFERENCES.map(({ id: key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-3">
                  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={!!preferences[key]}
                      onChange={() => togglePreference(key)}
                      className="peer sr-only"
                    />
                    <span
                      className="absolute inset-0 rounded border-2 border-white/60 bg-transparent peer-checked:border-white"
                      aria-hidden
                    />
                    <svg
                      className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                      viewBox="0 0 12 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M1 5l3 3 7-7" />
                    </svg>
                  </span>
                  <span className="text-white">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Experience Contribution */}
        <section className="mt-8">
          <h3 className="text-lg font-medium text-white">
            Experience Contribution
          </h3>
          <p className="text-sm text-white/70 whitespace-pre-wrap">
            {String(experience.description ?? "").trim()
              ? String(experience.description)
              : String(experience.agenda ?? "").trim()
                ? String(experience.agenda)
                : "Covers the full curated experience, including food, drinks, and activities."}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Image
              src="/coins.svg"
              alt=""
              width={28}
              height={28}
              className="h-6 w-6 shrink-0"
            />
            <span className="text-lg font-medium text-white">
              {experience.coinPrice} Coins per person
            </span>
          </div>
          <p className="text-xs text-white/60">
            *Coins are created only for this experience. If it&apos;s cancelled,
            they&apos;ll stay in your wallet to use later.
          </p>
        </section>
      </BaseLayout>

      {/* Pay */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4">
        <div className="mx-auto max-w-md space-y-2">
          {error ? (
            <p className="text-center text-sm text-red-300">{error}</p>
          ) : null}
          <button
            type="button"
            onClick={handleProceed}
            disabled={joining || !user?.uid}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-4 text-lg font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
          >
            <Image
              src="/coins.svg"
              alt=""
              width={28}
              height={28}
              className="h-6 w-6"
            />
            {joining ? "Paying…" : `Pay ${experience.coinPrice} Coins`}
          </button>
        </div>
      </div>
    </div>
  );
}

