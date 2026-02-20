"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ExperienceCoverCard } from "@/components/ExperienceCoverCard";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { getExperiencesByHost } from "@/lib/firestore-experiences";
import type { Experience } from "@/types";

const pillSelectedStyle = {
  borderRadius: "15px",
  background:
    "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255, 255, 255, 0.10)",
  boxShadow:
    "0 0 16.1px 3px rgba(255, 255, 255, 0.54) inset, 0 0 16.1px 3px rgba(255, 255, 255, 0.54) inset",
};

type TabId = "saved" | "liked" | "hosted";

export default function ExperiencesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("saved");
  const [hostedExperiences, setHostedExperiences] = useState<Experience[]>([]);
  const [hostedLoading, setHostedLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getExperiencesByHost(user.uid)
      .then(setHostedExperiences)
      .finally(() => setHostedLoading(false));
  }, [user?.uid]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "saved", label: "Saved" },
    { id: "liked", label: "Liked" },
    { id: "hosted", label: "Hosted" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Experiences" backHref="/dashboard" />
      <main className="mx-auto max-w-md px-4 pt-2">
        {/* Pills – transparent bg, selected pill with gradient + inset glow */}
        <div className="flex w-full gap-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex-1 py-2.5 text-sm font-medium transition text-white"
              style={
                tab === id
                  ? pillSelectedStyle
                  : { background: "transparent", boxShadow: "none" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[120px]">
          {tab === "saved" && (
            <p className="text-sm text-white/70">
              Saved experiences will appear here.
            </p>
          )}

          {tab === "liked" && (
            <p className="text-sm text-white/70">
              Content you’ve liked will appear here.
            </p>
          )}

          {tab === "hosted" && (
            <div className="space-y-3">
              {hostedLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-64 w-full animate-pulse rounded-2xl bg-white/10"
                    />
                  ))}
                </div>
              ) : hostedExperiences.length > 0 ? (
                hostedExperiences.map((ex) => (
                  <div key={ex.id}>
                    <ExperienceCoverCard experience={ex} />
                  </div>
                ))
              ) : (
                <>
                  <p className="text-sm text-white/70">
                    Experiences you host will show up here.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
