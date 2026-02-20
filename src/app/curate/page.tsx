"use client";

import Link from "next/link";
import { ActionCard } from "@/components/ActionCard";
import { PageHeader } from "@/components/PageHeader";

export default function CuratePage() {
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

      {/* Bottom camera FAB */}
      <div className="fixed bottom-28 left-0 right-0 z-40 flex justify-center">
        <Link
          href="/tastelists"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/25 shadow-[inset_0_0_20px_8px_rgba(255,255,255,0.2)] backdrop-blur-xl transition active:scale-95"
          style={{
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.08), inset 0 0 20px 8px rgba(255,255,255,0.15)",
          }}
          aria-label="Add photo"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
