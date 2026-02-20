"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateUser } from "@/lib/firestore-users";
import { BaseLayout } from "@/components/BaseLayout";
import {
  CREW_FLOATING_EMOJIS,
  CREW_PERSONAS,
  getCrewPersonaFromPersona,
  type CrewPersonaId,
} from "@/lib/personas";

function renderQuoteWithBold(text: string): React.ReactNode[] {
  const parts = text.split(/(<b>|<\/b>)/g);
  const nodes: React.ReactNode[] = [];
  let inBold = false;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "<b>") inBold = true;
    else if (part === "</b>") inBold = false;
    else
      nodes.push(
        inBold ? (
          <span key={i} className="font-medium">
            {part}
          </span>
        ) : (
          part
        )
      );
  }
  return nodes;
}

const CAROUSEL_CARDS = [
  { image: "/persona_meta/exp.png" },
  { image: "/persona_meta/place.png" },
  { image: "/persona_meta/hobby.png" },
] as const;

const FLOATING_PLACEMENTS = [
  { left: "15%", top: "18%" },
  { left: "82%", top: "20%" },
  { left: "8%", top: "52%" },
  { left: "88%", top: "48%" },
] as const;

export default function RevealCharacterPage() {
  const router = useRouter();
  const { firebaseUser, user, refreshUser } = useAuth();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const crewId: CrewPersonaId =
    user?.persona != null ? getCrewPersonaFromPersona(user.persona) : "SAMMY";
  const crew = CREW_PERSONAS[crewId];

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 250;
    const onScroll = () => {
      const spacer = el.firstElementChild as HTMLElement | null;
      const spacerWidth = spacer?.offsetWidth ?? 0;
      const viewportCenter = el.scrollLeft + el.clientWidth / 2;
      const cardCenter0 = spacerWidth + cardWidth / 2;
      const index = Math.round((viewportCenter - cardCenter0) / cardWidth);
      setCarouselIndex(Math.min(Math.max(0, index), CAROUSEL_CARDS.length - 1));
    };
    onScroll();
    el.addEventListener("scroll", onScroll);
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser && !user) return;
    if (user === undefined) return; // still loading
    if (!firebaseUser) {
      router.push("/");
    }
  }, [firebaseUser, user, router]);

  const handleProceed = async () => {
    if (!firebaseUser?.uid) return;
    try {
      await createOrUpdateUser(firebaseUser.uid, {
        onboardingComplete: true,
      });
      await refreshUser();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (user === undefined || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex min-h-dvh flex-col items-center overflow-y-auto overflow-x-hidden">
      <BaseLayout className="flex min-h-0 flex-col pt-10 pb-8 px-4">
        {/* Title + Character (no gap) */}
        <div className="flex flex-col items-center justify-start">
          <div className="text-center">
            <p className="text-[16px] font-medium tracking-wider uppercase text-white/90 pb-1">
              The crew calls you
            </p>
            <p className="font-led-counter text-white text-6xl leading-none">
              {crew.name}
            </p>
          </div>

          {/* Character + floating emojis */}
          <div
            className="relative -mt-8 w-full max-w-[340px]"
            style={{ aspectRatio: "1" }}
          >
            {CREW_FLOATING_EMOJIS[crewId].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-5xl md:text-5xl select-none"
                style={{
                  left: FLOATING_PLACEMENTS[i].left,
                  top: FLOATING_PLACEMENTS[i].top,
                  transform: "translate(-50%, -50%)",
                  animation: `finding-float 2.5s ease-in-out ${i * 0.15}s infinite`,
                }}
              >
                {emoji}
              </span>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full">
                <Image
                  src={crew.imageUrl}
                  alt={crew.name}
                  fill
                  className="object-contain drop-shadow-lg"
                  sizes="75px"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Quote */}
          <p className="-mt-15 max-w-sm text-center text-sm leading-relaxed text-white/95 px-10">
            &ldquo;{renderQuoteWithBold(crew.quote)}&rdquo;
          </p>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="relative z-0 -mx-4 mt-6 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="min-w-[calc(50%-125px)] shrink-0" aria-hidden />
            {CAROUSEL_CARDS.map((card, i) => (
              <div
                key={i}
                className={`relative h-[280px] w-[250px] shrink-0 snap-center overflow-hidden rounded-2xl transition-all duration-300 ${
                  i === carouselIndex
                    ? "z-10 scale-105 blur-0 opacity-100"
                    : "scale-[0.92] blur-xs opacity-75"
                }`}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            ))}
            <div className="min-w-[calc(50%-125px)] shrink-0" aria-hidden />
          </div>
        </div>

        {/* Proceed - padding so button stays visible on small screens */}
        <div className="sticky bottom-0 z-20 flex w-full flex-col items-center gap-4 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full rounded-2xl bg-black py-4 text-base font-semibold text-white shadow-lg transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            Proceed
          </button>
        </div>
      </BaseLayout>
    </div>
  );
}
