"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTasteList,
  getTasteListItems,
  getTasteListsByOwner,
} from "@/lib/firestore-tastelists";
import { BaseLayout } from "@/components/BaseLayout";
import { PageHeader } from "@/components/PageHeader";
import { Ripple } from "@/components/Ripple";
import type { TasteList } from "@/types";

const EXPERIENCE_EMOJIS = ["✨", "🎯", "🚀", "📍", "🎉", "🏷️", "💡", "🎪"];
const EMOJI_POSITIONS = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
] as const;
const PLACEMENT_TO_XY: Record<
  (typeof EMOJI_POSITIONS)[number],
  { x: number; y: number }
> = {
  top: { x: 50, y: 10 },
  bottom: { x: 55, y: 80 },
  left: { x: 12, y: 55 },
  right: { x: 85, y: 50 },
  "top-left": { x: 20, y: -10 },
  "top-right": { x: 80, y: -15 },
  "bottom-left": { x: 15, y: 90 },
  "bottom-right": { x: 80, y: 95 },
};

export default function SelectListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<TasteList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getTasteListsByOwner(user.uid)
      .then(setLists)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const [generating, setGenerating] = useState(false);

  const handleProceed = async () => {
    if (!selectedId) return;
    const list = lists.find((l) => l.id === selectedId);
    if (!list) return;
    setGenerating(true);
    try {
      const [tasteListData, items] = await Promise.all([
        getTasteList(selectedId),
        getTasteListItems(selectedId),
      ]);
      const placeItems = items.filter((i) => i.type === "place");
      const body =
        placeItems.length > 0
          ? {
              tasteList: {
                name: tasteListData?.name ?? list.name,
                description: tasteListData?.description ?? "",
                places: placeItems.map((p) => ({
                  name: p.title,
                  address: p.address ?? "",
                  lat: p.geo?.latitude ?? null,
                  lng: p.geo?.longitude ?? null,
                  note: p.tips ?? "",
                })),
              },
            }
          : {
              tasteListContext: `${list.name}: ${tasteListData?.description ?? ""}`,
            };
      const res = await fetch("/api/experience/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Generate failed");
      const data = await res.json();
      sessionStorage.setItem(
        `experience-generated-${selectedId}`,
        JSON.stringify(data)
      );
      router.push(`/experience/new?tastelistId=${selectedId}`);
    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  };
  const username = user?.username
    ? `/${user.username}`
    : user?.nickname
      ? `/${user.nickname.toLowerCase().replace(/\s/g, "")}`
      : "/user";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/90">Loading…</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="fixed inset-0 z-20 flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <BaseLayout className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative h-[72vmin] w-[72vmin] max-h-[340px] max-w-[340px]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <Ripple
                color="rgba(255, 255, 255, 0.25)"
                size="0.75rem"
                duration={3}
                maxSpread="30vmax"
                className="bg-white/30"
              />
            </div>
            {EXPERIENCE_EMOJIS.map((emoji, i) => {
              const { x, y } = PLACEMENT_TO_XY[EMOJI_POSITIONS[i]];
              return (
                <span
                  key={i}
                  className="absolute select-none text-4xl md:text-5xl"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    animation: `finding-float 2s ease-in-out ${i * 0.1}s infinite`,
                  }}
                >
                  {emoji}
                </span>
              );
            })}
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 md:h-24 md:w-24">
              <Image
                src="/logo.svg"
                alt=""
                fill
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-light text-white/90">Hold on…</p>
            <p className="px-4 text-2xl font-medium text-white">
              Creating your experience
            </p>
          </div>
        </BaseLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="" backHref="/curate" />

      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <h1 className="mb-3 text-left text-xl font-medium text-white">
          Select the list to make an experience
        </h1>
        {lists.length === 0 ? (
          <div className="rounded-2xl border border-white/40 bg-white/20 p-8 text-center backdrop-blur-xl">
            <p className="text-white/90">
              No TasteLists yet.{" "}
              <Link href="/tastelists/new" className="underline">
                Create one
              </Link>{" "}
              to host an experience.
            </p>
            <Link
              href="/tastelists/new"
              className="mt-4 inline-block rounded-[15px] bg-black px-6 py-3 text-sm font-medium text-white"
            >
              Create TasteList
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => {
              const isSelected = selectedId === list.id;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setSelectedId(list.id)}
                  className={`flex w-full items-center gap-4 rounded-[20px] border border-[#E5E5E5] p-4 text-left transition ${
                    isSelected ? "" : "bg-white/20"
                  }`}
                  style={
                    isSelected
                      ? {
                          background:
                            "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%)",
                          boxShadow:
                            "0 0 16.1px 3px rgba(255, 255, 255, 0.54) inset, 0 0 0.8px 1px rgba(255, 255, 255, 0.62) inset",
                        }
                      : {
                          boxShadow:
                            "0 0 0.8px 1px rgba(255, 255, 255, 0.62) inset",
                        }
                  }
                >
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                    style={{
                      background:
                        "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                    }}
                  >
                    {list.coverImage ? (
                      <Image
                        src={list.coverImage}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/70">{username}</p>
                    <p className="mt-2 text-xl font-medium tracking-tighter text-white">
                      {list.name}
                    </p>
                    <p className="text-sm text-white/70">0 saves</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {lists.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4">
            <div className="mx-auto max-w-md">
              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedId}
                className="w-full rounded-[16px] bg-black py-4 text-base font-semibold text-white transition disabled:opacity-50 active:scale-[0.98]"
              >
                Proceed
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
