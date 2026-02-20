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
  {
    image: "/personas/car1.png",
    icon: "❤️",
    title: "Experience",
    subtitle: "Exposure you are looking for",
  },
  {
    image: "/personas/car2.png",
    icon: "📍",
    title: "Place",
    subtitle: "Where you are looking for",
  },
  {
    image: "/personas/car3.png",
    icon: "⭐",
    title: "Hobby",
    subtitle: "What you are looking for",
  },
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
    const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 16;
    const cardWidth = 250;
    const gap = 16;
    const cardStep = cardWidth + gap;
    const onScroll = () => {
      const { scrollLeft } = el;
      // Card centers are at: paddingLeft + (offsetWidth/2 - 125) + 125 + i*cardStep = paddingLeft + offsetWidth/2 + i*cardStep
      // Viewport center = scrollLeft + offsetWidth/2. Match: scrollLeft ≈ paddingLeft + i*cardStep
      const index = Math.round((scrollLeft - paddingLeft) / cardStep);
      setCarouselIndex(Math.min(Math.max(0, index), CAROUSEL_CARDS.length - 1));
    };
    onScroll(); // set initial state
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!firebaseUser && !user) return;
    if (user === undefined) return; // still loading
    if (!firebaseUser) {
      router.push("/login");
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
    <div className="fixed inset-0 z-20 flex min-h-screen flex-col items-center overflow-y-auto overflow-x-hidden">
      <BaseLayout className="flex flex-1 flex-col pt-10 pb-8 px-4 min-h-0 overflow-hidden">
        {/* Title + Character (no gap) */}
        <div className="flex flex-1 flex-col items-center justify-start">
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
            className="-mx-4 mt-6 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="min-w-[calc(50%-125px)] shrink-0" aria-hidden />
            {CAROUSEL_CARDS.map((card, i) => (
              <div
                key={i}
                className={`relative h-[280px] w-[250px] shrink-0 snap-center rounded-2xl bg-white shadow-lg transition-all duration-300 overflow-hidden ${
                  i === carouselIndex
                    ? "scale-100 blur-0"
                    : "scale-[0.92] blur-[3px] opacity-80"
                }`}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl bg-white shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-4 flex flex-col justify-end text-center">
                  <p className="text-base font-bold text-white drop-shadow-sm">
                    {card.icon} {card.title}
                  </p>
                  <p className="text-xs text-white/90 drop-shadow-sm">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            ))}
            <div className="min-w-[calc(50%-125px)] shrink-0" aria-hidden />
          </div>
        </div>

        {/* Proceed */}
        <div className="sticky bottom-0 flex w-full flex-col items-center gap-4 pt-4">
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
