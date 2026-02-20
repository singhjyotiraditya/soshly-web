"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { CREW_PERSONAS, getCrewPersonaFromPersona } from "@/lib/personas";
import { getPublishedExperiences } from "@/lib/firestore-experiences";
import type { Experience } from "@/types";

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

const CARD_WIDTH = 270;
const CARD_SPACING = 14;
const TOTAL_CARD_WIDTH = CARD_WIDTH + CARD_SPACING;

export default function DashboardPage() {
  const { user } = useAuth();
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [exploreSlides, setExploreSlides] = useState<ExploreSlide[]>([]);

  useEffect(() => {
    const currentUserId = user?.uid ?? null;
    getPublishedExperiences(100)
      .then((exps) => {
        const byOthers = currentUserId
          ? exps.filter((e) => e.hostId !== currentUserId)
          : exps;
        setExploreSlides(byOthers.map(experienceToSlide));
      })
      .catch(console.error);
  }, [user?.uid]);

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
  const location = "Chandigarh"; // TODO: derive from user geo
  const avatarFallback =
    user?.persona != null
      ? CREW_PERSONAS[getCrewPersonaFromPersona(user.persona)].imageUrl
      : CREW_PERSONAS.IZU.imageUrl;

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
              <p className="flex items-center gap-1 text-sm text-white">
                <Image
                  src="/nav/location_fill.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="shrink-0"
                />
                {location}
              </p>
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

        {/* Top Experiences for you – live tastelists where you're not the owner */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Top Experiences for you:-
          </h2>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {[
              {
                title: "Sip • Play • Chill",
                subtitle: "Café XYZ – Korean Café & Gaming Lounge",
                desc: "Go to cafe and enjoy blah blah blah etcetcetc",
                seed: "cafe",
              },
              {
                title: "Skate",
                subtitle: "Skate Park Session",
                desc: "Ride the ramps",
                seed: "skate",
              },
              {
                title: "Food Tour",
                subtitle: "Street Food Crawl",
                desc: "Taste the best local bites",
                seed: "streetfood",
              },
            ].map((exp) => (
              <Link
                key={exp.seed}
                href="/tastelists"
                className="relative block h-48 w-72 shrink-0 overflow-hidden rounded-2xl shadow-lg"
              >
                <Image
                  src={`https://picsum.photos/seed/${exp.seed}/600/400`}
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold">{exp.title}</h3>
                  <p className="text-sm opacity-90">{exp.subtitle}</p>
                  <p className="mt-1 line-clamp-2 text-xs opacity-80">
                    {exp.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Explore – scroll-based carousel, cards tilt on circular path */}
        <section className="pt-6 pb-16">
          <h2 className="mb-3 text-lg font-semibold text-white">Explore</h2>
          {/*
            NOTE: We intentionally do NOT use CSS scroll-snap here.
            Because cards are transformed (rotate/scale/translate), browser snap points can feel inconsistent.
            We instead snap manually to the nearest card once scrolling stops (Flutter-style).
          */}
          <div
            ref={exploreScrollRef}
            className="explore-scroll -mx-4 flex overflow-x-auto overflow-y-visible px-0 py-14"
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
                      className="block h-[420px] w-full overflow-hidden rounded-2xl shadow-xl"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={slide.cover ?? `https://picsum.photos/seed/${slide.seed}/400/680`}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="270px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute left-3 top-3 text-3xl">
                          {slide.emoji}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <h3 className="text-2xl font-bold tracking-tight">
                            {slide.title}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider opacity-90">
                            {slide.subtitle}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-xs opacity-85">
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
      </main>

      <BottomNav />
    </div>
  );
}
