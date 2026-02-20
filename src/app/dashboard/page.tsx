"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { CREW_PERSONAS, getCrewPersonaFromPersona } from "@/lib/personas";
import { getPublishedExperiences } from "@/lib/firestore-experiences";
import { getPublicTasteListsFromOthers } from "@/lib/firestore-tastelists";
import type { Experience, TasteList } from "@/types";

const frostedCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl bg-white/20 shadow-lg";

type ExploreSlide = {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  emoji: string;
  seed: string;
  cover?: string;
};

function experienceToSlide(exp: Experience): ExploreSlide {
  const start = exp.startTime ? new Date(exp.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";
  return {
    id: exp.id,
    title: exp.title,
    subtitle: exp.location?.address ?? (start || "Experience"),
    desc: exp.description,
    emoji: "✨",
    seed: exp.id,
    cover: exp.cover,
  };
}

const CARD_WIDTH = 300;
const CARD_SPACING = 14;
const TOTAL_CARD_WIDTH = CARD_WIDTH + CARD_SPACING;

export default function DashboardPage() {
  const { user, loading: authLoading, firebaseUser } = useAuth();
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [exploreSlides, setExploreSlides] = useState<ExploreSlide[]>([]);
  const [otherTastelists, setOtherTastelists] = useState<TasteList[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  const userDataLoading = authLoading || (!!firebaseUser && user === null);

  // Resolve current location (geolocation + Mapbox reverse geocode) – only show if we have it
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!token) return;
        const { longitude, latitude } = position.coords;
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,locality,region&limit=1`
        )
          .then((res) => res.json())
          .then((data) => {
            const feature = data.features?.[0];
            const name = feature?.text ?? feature?.place_name?.split(",")[0];
            if (name) setCurrentLocation(name);
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Clear and only fetch after user state is resolved so we never show "all" (including mine) briefly
  useEffect(() => {
    if (userDataLoading) {
      setExploreSlides([]);
      setOtherTastelists([]);
      return;
    }
  }, [userDataLoading]);

  useEffect(() => {
    if (userDataLoading) return;
    const currentUserId = user?.uid ?? null;
    getPublishedExperiences(100)
      .then((exps) => {
        const byOthers = currentUserId
          ? exps.filter((e) => e.hostId !== currentUserId)
          : exps;
        setExploreSlides(byOthers.map(experienceToSlide));
      })
      .catch(console.error);
  }, [userDataLoading, user?.uid]);

  useEffect(() => {
    if (userDataLoading) return;
    getPublicTasteListsFromOthers(user?.uid ?? null, 20)
      .then(setOtherTastelists)
      .catch(console.error);
  }, [userDataLoading, user?.uid]);

  useEffect(() => {
    const el = exploreScrollRef.current;
    if (!el) return;
    let rafId: number | null = null;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;

    const snapToNearest = () => {
      const vw = el.clientWidth;
      const pad = Math.max(0, (vw - CARD_WIDTH) / 2);
      const currentCenter = el.scrollLeft + vw / 2;
      const rawIndex =
        (currentCenter - pad - CARD_WIDTH / 2) / TOTAL_CARD_WIDTH;
      const nearestIndex = Math.min(
        exploreSlides.length - 1,
        Math.max(0, Math.round(rawIndex))
      );
      const targetCenter =
        pad + nearestIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;
      const targetScrollLeft = targetCenter - vw / 2;
      el.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    };

    const scheduleSnap = () => {
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(snapToNearest, 120);
    };

    const onScroll = () => {
      scheduleSnap();
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setScrollOffset(el.scrollLeft);
      });
    };
    const onResize = () => setViewportWidth(el.clientWidth);
    onResize();
    setScrollOffset(el.scrollLeft);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (snapTimer) clearTimeout(snapTimer);
      ro.disconnect();
    };
  }, [exploreSlides.length]);

  const displayName =
    user?.nickname ||
    user?.fullName?.split(" ")[0] ||
    user?.username ||
    "Explorer";
  const avatarFallback =
    user?.persona != null
      ? CREW_PERSONAS[getCrewPersonaFromPersona(user.persona)].imageUrl
      : CREW_PERSONAS.IZU.imageUrl;

  if (userDataLoading) {
    return (
      <div className="min-h-screen pb-24">
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer-bg {
            background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.06) 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
        <header className="sticky top-0 z-30 pt-4 pb-4">
          <div className="mx-auto flex max-w-md items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20 shimmer-bg" />
              <div className="space-y-2">
                <div className="h-5 w-28 rounded-lg bg-white/20 shimmer-bg" />
                <div className="h-4 w-20 rounded bg-white/15 shimmer-bg" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded-full bg-white/20 shimmer-bg" />
              <div className="h-10 w-10 rounded-full bg-white/20 shimmer-bg" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 pt-6">
          <div className="space-y-4">
            <div className="h-32 w-full rounded-2xl bg-white/10 shimmer-bg" />
            <div className="flex gap-4 overflow-hidden">
              <div className="h-56 w-72 shrink-0 rounded-2xl bg-white/10 shimmer-bg" />
              <div className="h-56 w-72 shrink-0 rounded-2xl bg-white/10 shimmer-bg" />
            </div>
            <div className="h-6 w-48 rounded bg-white/15 shimmer-bg" />
            <div className="flex gap-4 overflow-hidden">
              <div className="h-64 w-[280px] shrink-0 rounded-2xl bg-white/10 shimmer-bg" />
              <div className="h-64 w-[280px] shrink-0 rounded-2xl bg-white/10 shimmer-bg" />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 pt-4 pb-4">
        <div className="mx-auto flex max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white shadow-[inset_0_0_12px_4px_rgba(255,255,255,0.6)]">
              <Image
                src={user?.photoURL || avatarFallback}
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-cover object-[center_30%]"
              />
            </div>
            <div>
              <h1 className="text-xl font-medium text-white">{displayName}</h1>
              {currentLocation ? (
                <p className="flex items-center gap-1 text-sm text-white">
                  <Image
                    src="/nav/location_fill.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="shrink-0"
                  />
                  {currentLocation}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/curate"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent shadow-[inset_0_0_12px_4px_rgba(255,255,255,0.6)]"
              aria-label="Add"
            >
              <Image
                src="/plus.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </Link>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent shadow-[inset_0_0_12px_4px_rgba(255,255,255,0.6)]"
              aria-label="Notifications"
            >
              <Image
                src="/notif.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </button>
            <Link
              href="/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent shadow-[inset_0_0_12px_4px_rgba(255,255,255,0.6)]"
              aria-label="Messages"
            >
              <Image
                src="/chat.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4">
        {/* Search */}
        <div className={`${frostedCard} flex items-center gap-2 px-4 py-3`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-white"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search here..."
            className="w-full bg-transparent text-white placeholder:text-white/70 outline-none"
          />
        </div>

        {/* Curate your Taste card */}
        <Link href="/curate" className="block">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/80 bg-transparent p-6 shadow-[inset_0_0_80px_40px_rgba(255,255,255,0.5)] transition active:scale-[0.99]">
            <p className="text-center text-sm text-white/90">
              It&apos;s time to show your taste
            </p>
            <h2 className="text-center text-lg font-medium text-white">
              Curate your Taste !! 😉
            </h2>
            <div className="mt-4 flex h-20 items-center justify-center">
              {[1, 2, 3, 4, 5].map((i) => {
                const isCenter = i === 3;
                const isInner = i === 2 || i === 4;
                const size = isCenter
                  ? "h-20 w-20"
                  : isInner
                    ? "h-14 w-14"
                    : "h-11 w-11";
                const zIndex = isCenter ? "z-30" : isInner ? "z-20" : "z-10";
                const rotate =
                  i === 1
                    ? "-rotate-12 mt-3"
                    : i === 2
                      ? "-rotate-6"
                      : i === 4
                        ? "rotate-6"
                        : i === 5
                          ? "rotate-12 mt-3"
                          : "";
                return (
                  <div
                    key={i}
                    className={`relative -ml-3 flex shrink-0 items-center justify-center overflow-hidden rounded-sm first:ml-0 ${size} ${zIndex} ${rotate}`}
                  >
                    <Image
                      src={`https://picsum.photos/seed/taste${i}/128/128`}
                      alt=""
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Link>

        {/* Tastelists from other users – only show if any have cover */}
        {(() => {
          const tastelistsWithCover = otherTastelists.filter((list) => list.coverImage);
          if (tastelistsWithCover.length === 0) return null;
          const singleCard = tastelistsWithCover.length === 1;
          return (
        <section>
          <h2 className="mb-3 text-xl font-medium text-white">
            Top Experiences for you:-
          </h2>
          <div
            className={
              singleCard
                ? "w-full pb-2"
                : "scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2"
            }
          >
            {tastelistsWithCover.map((list) => (
                <Link
                  key={list.id}
                  href={`/tastelists/${list.id}`}
                  className={`relative block h-56 overflow-hidden rounded-2xl ${
                    singleCard ? "w-full" : "w-80 shrink-0"
                  }`}
                >
                  {list.coverImage ? (
                    <Image
                      src={list.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  {/* Bottom frosted blur that fades upward */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background: "rgba(255, 255, 255, 0.10)",
                      backdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
                      WebkitBackdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
                      maskImage:
                        "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pt-10 text-center text-white">
                    <h3 className="font-medium">{list.name}</h3>
                    {list.description ? (
                      <p className="mt-1 line-clamp-2 text-xs opacity-90">
                        {list.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
            ))}
          </div>
        </section>
          );
        })()}

        {/* Explore – scroll-based carousel, only show if any experiences */}
        {exploreSlides.length > 0 && (
        <section className="pb-16">
          <h2 className="mb-1 text-xl font-medium text-white">Explore!</h2>
          {/*
            NOTE: We intentionally do NOT use CSS scroll-snap here.
            Because cards are transformed (rotate/scale/translate), browser snap points can feel inconsistent.
            We instead snap manually to the nearest card once scrolling stops (Flutter-style).
          */}
          <div
            ref={exploreScrollRef}
            className="explore-scroll -mx-4 flex overflow-x-auto overflow-y-visible px-0 py-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <style>{`.explore-scroll::-webkit-scrollbar { display: none; }`}</style>
            <div
              className="flex"
              style={{
                paddingLeft: Math.max(0, (viewportWidth - CARD_WIDTH) / 2),
                paddingRight: Math.max(0, (viewportWidth - CARD_WIDTH) / 2),
              }}
            >
              {exploreSlides.map((slide, i) => {
                const pad = Math.max(0, (viewportWidth - CARD_WIDTH) / 2);
                const cardCenter =
                  pad +
                  i * TOTAL_CARD_WIDTH +
                  CARD_WIDTH / 2 -
                  scrollOffset;
                const viewportCenter = viewportWidth / 2;
                const normalised =
                  viewportWidth > 0
                    ? (cardCenter - viewportCenter) / TOTAL_CARD_WIDTH
                    : 0;
                const clamped = Math.max(-1.5, Math.min(1.5, normalised));
                const angleDeg = Math.abs(clamped) < 0.35 ? 0 : clamped * 5.73;
                const scale = 1 - Math.abs(clamped) * 0.08;
                const translateY = Math.abs(clamped) * 24;

                return (
                  <div
                    key={slide.id}
                    className="shrink-0 will-change-transform"
                    style={{
                      width: CARD_WIDTH,
                      marginLeft: i === 0 ? 0 : CARD_SPACING,
                      transformOrigin: "center bottom",
                      transform: `translate3d(0, ${translateY}px, 0) rotate(${angleDeg}deg) scale(${scale})`,
                    }}
                  >
                    <Link
                      href={`/experience/${slide.id}`}
                      className="block h-[420px] w-full overflow-hidden rounded-2xl"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={slide.cover ?? `https://picsum.photos/seed/${slide.seed}/400/680`}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="300px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        {/* Bottom frosted blur that fades upward */}
                        <div
                          className="absolute inset-0 z-10 pointer-events-none"
                          style={{
                            background: "rgba(255, 255, 255, 0.10)",
                            backdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
                            WebkitBackdropFilter: "blur(10px) saturate(1.1) brightness(1.1)",
                            WebkitMaskImage:
                              "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
                            maskImage:
                              "linear-gradient(to bottom, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 65%)",
                          }}
                        />
                        <div className="absolute left-3 top-3 z-20 text-3xl">
                          {slide.emoji}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pt-10 text-center text-white">
                          <h3 className="font-gayathri text-2xl font-medium tracking-tight">
                            {slide.title}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium tracking-tight opacity-90">
                            {slide.subtitle}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-xs font-medium opacity-90">
                            {slide.desc}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
