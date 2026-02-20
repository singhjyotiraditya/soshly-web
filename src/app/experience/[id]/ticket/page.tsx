"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getExperience } from "@/lib/firestore-experiences";
import { getUser } from "@/lib/firestore-users";
import { PageHeader } from "@/components/PageHeader";
import { BaseLayout } from "@/components/BaseLayout";
import type { Experience } from "@/types";

function formatDateShort(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${weekday}, ${day} ${month}`;
}

function formatTimeRange(
  startIso: string | undefined,
  endIso: string | undefined,
  durationMin: number
): string {
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

export default function TicketPage() {
  const params = useParams();
  const id = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExperience(id).then((exp) => {
      setExperience(exp ?? null);
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
  const locationStr =
    experience.meetingPoint || experience.location?.address || "—";

  return (
    <div className="min-h-screen pb-32">
      <BaseLayout className="px-4 pt-4">
        <div className="text-center">
          <h2 className="text-xl font-medium text-white">
            You&apos;re in 🤩
          </h2>
          <p className="mt-1 text-md text-white">Here is your Ticket</p>
          <p className="mt-0.5 text-sm text-white/80">
            (You can find it in your profile too)
          </p>
        </div>

        {/* Ticket card with ticket.png background */}
        <div
          className="relative mx-auto mt-6 max-w-sm overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat px-4 pb-6 pt-4"
          style={{ backgroundImage: "url(/ticket.png)" }}
        >
          {/* Top image panel (white rounded area with cover) */}
          <div className="mb-4 overflow-hidden rounded-xl bg-white">
            {experience.cover ? (
              <div className="relative aspect-4/3 w-full">
                <Image
                  src={experience.cover}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 384px) 100vw, 384px"
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

          {/* Event details on orange ticket background */}
          <div className="text-center text-white">
            <h3 className="font-gayathri text-xl font-bold tracking-tight">
              {experience.title}
            </h3>
            {venue ? (
              <p className="mt-1 text-sm text-white/95">{venue}</p>
            ) : null}
            <p className="mt-0.5 text-xs text-white/90">
              Hosted by: {hostName ?? "…"}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {["Social", "Chill", "Playful"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/70 bg-orange-400/30 px-2.5 py-0.5 text-xs font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>📅 {dateStr}</span>
                <span className="text-white/70">•</span>
                <span>🕕 {timeStr}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-red-200">📍</span>
                <span>{locationStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={`/experience/${id}/chat`}
            className="flex w-full max-w-sm items-center justify-center rounded-2xl bg-zinc-900 px-5 py-4 text-lg font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            View group chat
          </Link>
          <Link
            href={`/experience/${id}`}
            className="text-sm font-medium text-white/90 underline"
          >
            Later
          </Link>
        </div>
      </BaseLayout>
    </div>
  );
}
