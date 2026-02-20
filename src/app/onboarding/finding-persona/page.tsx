"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BaseLayout } from "@/components/BaseLayout";
import { Ripple } from "@/components/Ripple";

const EMOJIS = ["👽", "🤩", "🍭", "🎭", "🎲", "😍", "🧃", "🍟"];
const REDIRECT_DELAY_MS = 4000;

type EmojiPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const EMOJI_POSITIONS: EmojiPlacement[] = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
];

const PLACEMENT_TO_XY: Record<EmojiPlacement, { x: number; y: number }> = {
  top: { x: 50, y: 10 },
  bottom: { x: 55, y: 80 },
  left: { x: 12, y: 55 },
  right: { x: 85, y: 50 },
  "top-left": { x: 20, y: -10 },
  "top-right": { x: 80, y: -15 },
  "bottom-left": { x: 15, y: 90 },
  "bottom-right": { x: 80, y: 95 },
};

export default function FindingPersonaPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/onboarding/reveal-character");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="fixed inset-0 z-20 flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <BaseLayout className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative h-[72vmin] w-[72vmin] max-h-[340px] max-w-[340px]">
          <div className="absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none">
            <Ripple
              color="rgba(255, 255, 255, 0.25)"
              size="0.75rem"
              duration={3}
              maxSpread="30vmax"
              className="bg-white/30"
            />
          </div>
          {EMOJIS.map((emoji, i) => {
            const { x, y } = PLACEMENT_TO_XY[EMOJI_POSITIONS[i]];
            return (
              <span
                key={i}
                className="absolute text-4xl md:text-5xl select-none"
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
          {/* Logo in center */}
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

        {/* Bottom text */}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-light text-white/90">Hold On..</p>
          <p className="text-2xl font-medium text-white px-4">
            We are creating your playlist
          </p>
        </div>
      </BaseLayout>
    </div>
  );
}
