"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getExperience } from "@/lib/firestore-experiences";
import { getTicketForUserAndExperience } from "@/lib/firestore-wallet";
import { BaseLayout } from "@/components/BaseLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import type { Experience } from "@/types";

const fieldBlock =
  "rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]";

function formatStartDisplay(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  const time = `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
  return `${weekday}, ${month} ${day} at ${time}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.round(minutes / 60);
  return hrs === 1 ? "1 hr" : `${hrs} hrs`;
}

export default function ExperienceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    getExperience(id)
      .then(setExperience)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !user?.uid) {
      setHasJoined(false);
      return;
    }
    getTicketForUserAndExperience(id, user.uid)
      .then((ticket) => setHasJoined(!!ticket))
      .catch(() => setHasJoined(false));
  }, [id, user?.uid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/90">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-white/90">Experience not found.</p>
        <Link href="/dashboard" className="text-white/80 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const durationMinutes = experience.duration ?? 60;
  const endTime =
    experience.endTime ||
    (experience.startTime
      ? new Date(
          new Date(experience.startTime).getTime() + durationMinutes * 60 * 1000
        ).toISOString()
      : undefined);
  const canJoin =
    experience.status === "published" && experience.seatsRemaining > 0;
  const subtitle = experience.location?.address ?? experience.meetingPoint ?? "";

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="Experience"
        backHref="/dashboard"
      />
      <BaseLayout className="mx-auto max-w-md px-6 pb-40 pt-2">
        <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl">
          <div className="relative aspect-square w-full">
            {experience.cover ? (
              <Image
                src={experience.cover}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <h1 className="font-gayathri text-4xl font-bold tracking-tight text-white">
            {experience.title}
          </h1>
          {subtitle ? (
            <p className="font-gayathri text-sm text-white/80">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          <div className={fieldBlock}>
            <p className="text-xs font-medium text-white/60">Event Title</p>
            <p className="min-h-[1.5em] text-lg font-medium text-white">
              {experience.title}
            </p>
          </div>

          <div className={fieldBlock}>
            <p className="text-xs font-medium text-white/60">Description</p>
            <p className="min-h-[1.5em] whitespace-pre-wrap text-lg font-medium text-white">
              {experience.description || "—"}
            </p>
          </div>

          <div className={`relative ${fieldBlock}`}>
            <div className="relative pr-8 space-y-4">
              <div
                className="absolute right-3.5 top-6 bottom-0 w-0 border-l border-dashed border-white"
                aria-hidden
              />
              <div
                className="absolute right-2 top-6 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
                aria-hidden
              />
              <div
                className="absolute right-2 bottom-0 h-3 w-3 translate-y-1/2 rounded-full bg-white"
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium text-white/60">Start</p>
                <p className="text-base font-medium text-white">
                  {formatStartDisplay(experience.startTime)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-white/60">Duration</p>
                <p className="text-base font-medium text-white">
                  {formatDuration(durationMinutes)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-white/60">End</p>
                <p className="text-base font-medium text-white">
                  {formatStartDisplay(endTime)}
                </p>
              </div>
            </div>
          </div>

          <div className={fieldBlock}>
            <p className="text-xs font-medium text-white/60">Location</p>
            <p className="min-h-[1.5em] text-lg font-medium text-white">
              {experience.meetingPoint ||
                experience.location?.address ||
                "—"}
            </p>
          </div>

          <div className={fieldBlock}>
            <p className="text-xs font-medium text-white/60">Capacity</p>
            <p className="text-lg font-medium text-white">
              {experience.maxParticipants} people
            </p>
          </div>

          <div className={fieldBlock}>
            <p className="text-xs font-medium text-white/60">
              Curated Experience Cost (per person)
            </p>
            <p className="text-lg font-medium text-white">
              {experience.coinPrice} Soshly Coins
            </p>
          </div>

          {experience.agenda ? (
            <div className={fieldBlock}>
              <p className="text-xs font-medium text-white/60">Agenda</p>
              <p className="mt-1 whitespace-pre-wrap text-base font-medium text-white">
                {experience.agenda}
              </p>
            </div>
          ) : null}

          {String(experience.whatToBring ?? "").trim() ? (
            <div className={fieldBlock}>
              <p className="text-xs font-medium text-white/60">
                What to Bring
              </p>
              <p className="min-h-[1.5em] whitespace-pre-wrap text-lg font-medium text-white">
                {experience.whatToBring}
              </p>
            </div>
          ) : null}

          <div className="mx-auto my-6 w-2/4 border-t border-white/50" aria-hidden />

          {String(experience.rules ?? "").trim() ? (
            <div className={fieldBlock}>
              <p className="text-xs font-medium text-white/60">Host Note</p>
              <p className="min-h-[1.5em] whitespace-pre-wrap text-lg font-medium text-white">
                {experience.rules}
              </p>
            </div>
          ) : null}
        </div>
      </BaseLayout>

      <div className="fixed bottom-0 left-0 right-0 z-20 space-y-3 px-4 pb-6 pt-4">
        <div className="mx-auto max-w-md space-y-3">
          {hasJoined ? (
            <Link
              href={`/experience/${id}/ticket`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-orange px-5 py-4 text-lg font-medium text-white transition hover:opacity-95 active:scale-[0.98] active:opacity-90"
            >
              View ticket
            </Link>
          ) : (
            <>
              {canJoin && (
                <Link
                  href={`/experience/${id}/join`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-orange px-5 py-4 text-lg font-medium text-white transition hover:opacity-95 active:scale-[0.98] active:opacity-90"
                >
                  <Image src="/star.svg" alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
                  Join experience
                </Link>
              )}
              <Link
                href="/tastelists"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-zinc-900 px-5 py-4 text-lg font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] active:bg-zinc-700"
              >
                <Image src="/save.svg" alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
                Save experience
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
