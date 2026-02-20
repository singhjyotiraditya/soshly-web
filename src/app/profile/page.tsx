"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ExperienceCoverCard } from "@/components/ExperienceCoverCard";
import { useAuth } from "@/contexts/AuthContext";
import { getExperiencesByHost } from "@/lib/firestore-experiences";
import { getTasteListsByOwner } from "@/lib/firestore-tastelists";
import { formatDateTime } from "@/lib/format";
import { CREW_PERSONAS, getCrewPersonaFromPersona } from "@/lib/personas";
import type { Experience, TasteList } from "@/types";

const frostedCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl bg-white/20 shadow-lg";

type ProfileTab = "tastelists" | "experience" | "liked";

function ProfileContent() {
  const { user, loading: authLoading, firebaseUser, signOut } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ProfileTab>("tastelists");

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t === "experience" || t === "tastelists" || t === "liked") {
      setTab(t);
    }
  }, [searchParams]);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [tastelists, setTastelists] = useState<TasteList[]>([]);
  const [tastelistsLoading, setTastelistsLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [experiencesLoading, setExperiencesLoading] = useState(true);

  const userDataLoading =
    authLoading || (!!firebaseUser && user === null);

  const displayName =
    user?.nickname ||
    user?.fullName ||
    user?.username ||
    "Explorer";
  const handle = user?.username ? `@${user.username}` : "";
  const avatarFallback =
    user?.persona != null
      ? CREW_PERSONAS[getCrewPersonaFromPersona(user.persona)].imageUrl
      : CREW_PERSONAS.IZU.imageUrl;

  const avatarSrc = user?.photoURL || avatarFallback;

  useEffect(() => {
    setAvatarLoaded(false);
  }, [avatarSrc]);

  const shareProfile = async () => {
    if (typeof window === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: `${displayName} on Soshly`,
        url: window.location.href,
        text: `Check out ${displayName}'s profile on Soshly`,
      });
    } catch {
      // ignore
    }
  };

  const stats = [
    { value: "0", label: "Followers" },
    { value: "0", label: "Following" },
    { value: "0", label: "Likes" },
  ];

  const interestIcons: Record<string, string> = {
    music: "♫",
    books: "📚",
    art: "🖼️",
    coffee: "☕",
    minimalism: "🍁",
    "indie jazz": "♫",
    philosophy: "🌳",
    "street art": "🎨",
    "specialty coffee": "•",
  };
  const interests = user?.interests ?? [];

  useEffect(() => {
    if (!user?.uid) return;
    getTasteListsByOwner(user.uid)
      .then(setTastelists)
      .finally(() => setTastelistsLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    getExperiencesByHost(user.uid)
      .then(setExperiences)
      .finally(() => setExperiencesLoading(false));
  }, [user?.uid]);

  const tastelistPath =
    user?.username
      ? `/${user.username}`
      : user?.nickname
        ? `/${user.nickname.toLowerCase().replace(/\s/g, "")}`
        : "/user";

  if (userDataLoading) {
    return (
      <div className="min-h-screen pb-24">
        <main className="mx-auto max-w-md px-4 pt-6">
          <div className="flex flex-col items-center pt-12">
            <div className="h-60 w-60 animate-pulse rounded-full bg-white/30" />
            <div className="mt-6 h-8 w-48 animate-pulse rounded-lg bg-white/20" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-white/20" />
            <div className="mt-6 flex w-full max-w-sm gap-2">
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-white/20" />
              <div className="h-11 w-24 animate-pulse rounded-xl bg-white/20" />
            </div>
            <div className="mt-6 flex w-full gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 flex-1 animate-pulse rounded-2xl bg-white/20"
                />
              ))}
            </div>
            <div className="mt-6 flex w-full flex-wrap justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-20 animate-pulse rounded-2xl bg-white/20"
                />
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <main className="mx-auto max-w-md px-4 pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="relative h-60 w-60 overflow-hidden rounded-full bg-white/90">
              {!avatarLoaded && (
                <div
                  className="absolute inset-0 z-10 animate-pulse rounded-full bg-white/60"
                  aria-hidden
                />
              )}
              <Image
                src={avatarSrc}
                alt=""
                width={240}
                height={240}
                className="h-full w-full object-cover object-[center_50%]"
                onLoad={() => setAvatarLoaded(true)}
              />
            </div>
            {/* Decorative icons around avatar (Figma) */}
            <span className="absolute -left-10 top-2 text-3xl opacity-80 -rotate-12">🏠</span>
            <span className="absolute -left-10 -translate-y-1/2 -translate-x-1 text-3xl opacity-80 rotate-6">🎬</span>
            <span className="absolute -right-10 top-2 text-3xl opacity-80 -rotate-[8deg]">🍻</span>
            <span className="absolute -bottom-0 -right-10 text-3xl opacity-80 rotate-12">🤗</span>
          </div>
          <h1 className="font-led-counter text-4xl pt-4 text-white drop-shadow-sm">
            {displayName}
          </h1>
          {handle && (
            <p className="text-sm text-white/90">{handle}</p>
          )}

          <div className="mt-4 flex w-full max-w-sm justify-center">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="rounded-2xl border border-white/60 bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:opacity-95 active:scale-[0.98]"
            >
              Log out
            </button>
          </div>

          {/* Stats */}
          <div className="mt-5 flex w-full items-stretch gap-0 px-4">
            {stats.flatMap((s, i) => {
              const card = (
                <div
                  key={s.label}
                  className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-orange-400 bg-white/10 px-3 py-4 shadow-[inset_0_2px_12px_rgba(255,255,255,0.45)] backdrop-blur-xl"
                >
                  <span className="text-2xl font-medium text-black">{s.value}</span>
                  <span className="text-xs text-black/80">{s.label}</span>
                </div>
              );
              const divider =
                i < stats.length - 1 ? (
                  <div
                    key={`divider-${s.label}`}
                    className="flex shrink-0 self-center px-3"
                    aria-hidden
                  >
                    <div className="h-16 w-px bg-black/20" />
                  </div>
                ) : null;
              return divider ? [card, divider] : [card];
            })}
          </div>

          {/* Interest tags */}
          {interests.length > 0 && (
            <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
              {interests.slice(0, 6).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-2xl border-[0.5px] border-orange-400 bg-transparent px-3 py-1.5 text-sm text-white shadow-[inset_0_4px_16px_rgba(255,255,255,0.4)]"
                >
                  {interestIcons[name.toLowerCase()] ?? ""} {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs: Tastelists | Experience | Liked */}
        <div className="mt-8">
          <div className="flex w-full">
            {(
              [
                { id: "tastelists" as const, label: "Tastelists" },
                { id: "experience" as const, label: "Experience" },
                { id: "liked" as const, label: "Liked" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 py-2.5 text-sm font-medium transition ${
                  tab === id
                    ? "rounded-[15px] text-white"
                    : "text-white/90 hover:text-white"
                }`}
                style={
                  tab === id
                    ? {
                        background:
                          "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255, 255, 255, 0.10)",
                        boxShadow:
                          "inset 0 0 16.1px 3px rgba(255, 255, 255, 0.54)",
                      }
                    : { background: "transparent", boxShadow: "none" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[120px]">
            {tab === "tastelists" && (
              <div className="space-y-3">
                {tastelistsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex w-full items-center gap-4 rounded-[20px] border border-[#E5E5E5] bg-white/20 p-4"
                      >
                        <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-white/30" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-16 animate-pulse rounded bg-white/30" />
                          <div className="h-5 w-32 animate-pulse rounded bg-white/30" />
                          <div className="h-3 w-12 animate-pulse rounded bg-white/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : tastelists.length > 0 ? (
                  tastelists.map((list) => (
                    <Link
                      key={list.id}
                      href={`/tastelists/${list.id}`}
                      className="flex w-full items-center gap-4 rounded-[20px] border border-[#E5E5E5] bg-white/20 p-4 text-left transition hover:bg-white/25"
                      style={{
                        boxShadow:
                          "0 0 0.8px 1px rgba(255, 255, 255, 0.62) inset",
                      }}
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
                        <p className="text-xs text-white/70">{tastelistPath}</p>
                        <p className="mt-2 text-xl font-medium tracking-tighter text-white truncate">
                          {list.name}
                        </p>
                        <p className="text-sm text-white/70">0 saves</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <>
                    <p className="text-sm text-white/70">
                      Your tastelists appear here. Create one to get started.
                    </p>
                    <Link
                      href="/tastelists/new"
                      className="mt-4 inline-block rounded-[15px] bg-black px-6 py-3 text-sm font-medium text-white"
                    >
                      Create TasteList
                    </Link>
                  </>
                )}
              </div>
            )}
            {tab === "experience" && (
              <div className="space-y-3">
                {experiencesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className={`${frostedCard} flex items-center gap-3 p-4`}
                      >
                        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/20" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-white/20" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-white/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : experiences.length > 0 ? (
                  experiences.map((ex) => (
                    <div key={ex.id} className="space-y-2">
                      <ExperienceCoverCard experience={ex} />
                    </div>
                  ))
                ) : (
                  <>
                    <p className="text-sm text-white/70">
                      Experiences you host show up here.
                    </p>
                  </>
                )}
              </div>
            )}
            {tab === "liked" && (
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Content you’ve liked will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/80">Loading…</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
