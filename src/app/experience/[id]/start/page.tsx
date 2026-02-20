"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getExperience } from "@/lib/firestore-experiences";
import {
  markTicketStarted,
  releaseEscrowIfThreshold,
  getStartedCount,
} from "@/lib/firestore-escrow";
import type { Experience } from "@/types";

export default function StartExperiencePage() {
  const params = useParams();
  const { user } = useAuth();
  const experienceId = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [startedCount, setStartedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getExperience(experienceId)
      .then((ex) => {
        setExperience(ex ?? null);
        if (ex) return getStartedCount(experienceId);
        return 0;
      })
      .then(setStartedCount)
      .finally(() => setLoading(false));
  }, [experienceId]);

  const handleMarkStarted = async () => {
    if (!user?.uid) return;
    setMarking(true);
    try {
      await markTicketStarted(experienceId, user.uid);
      const released = await releaseEscrowIfThreshold(experienceId, 1);
      setDone(true);
      setStartedCount((c) => (c ?? 0) + 1);
      if (released) {
        setExperience((prev) => (prev ? { ...prev, status: "started" } : null));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Experience not found.</p>
        <Link href="/dashboard" className="ml-2 underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/experience/${experienceId}`}
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Soshly
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {experience.title}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Confirm the experience has started. When all participants have
          confirmed, escrow is released to the host.
        </p>
        {startedCount != null && (
          <p className="mt-2 text-sm text-zinc-500">
            {startedCount} of {experience.maxParticipants} marked started
          </p>
        )}
        {experience.status === "started" && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-200">
            Event started. Escrow released to host.
          </p>
        )}
        {!done && experience.status !== "started" && (
          <button
            type="button"
            onClick={handleMarkStarted}
            disabled={marking}
            className="mt-6 w-full rounded-full bg-zinc-900 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {marking ? "Saving…" : "Mark as started"}
          </button>
        )}
        <Link
          href={`/experience/${experienceId}`}
          className="mt-4 block text-center text-sm text-zinc-500 underline"
        >
          Back to experience
        </Link>
      </main>
    </div>
  );
}
