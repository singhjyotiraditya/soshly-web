"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateUser } from "@/lib/firestore-users";
import { computePersonaFromInterests, VIBE_CARDS } from "@/lib/personas";
import { Text } from "@/components/ui/Text";

export default function OnboardingPage() {
  const { firebaseUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [likedInterests, setLikedInterests] = useState<string[]>([]);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [swipeHistory, setSwipeHistory] = useState<
    { index: number; liked: boolean }[]
  >([]);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push("/login");
    }
  }, [loading, firebaseUser, router]);

  const saveAndGoToDashboard = useCallback(async () => {
    if (!firebaseUser?.uid) return;
    try {
      const persona = computePersonaFromInterests(likedInterests);
      await createOrUpdateUser(firebaseUser.uid, {
        interests: likedInterests,
        persona,
      });
      await refreshUser();
      router.push("/onboarding/finding-persona");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }, [firebaseUser, likedInterests, refreshUser, router]);

  const advanceCard = useCallback(
    (liked: boolean) => {
      const card = VIBE_CARDS[swipeIndex];
      if (card) {
        setSwipeHistory((prev) => [...prev, { index: swipeIndex, liked }]);
        if (liked && !likedInterests.includes(card.id)) {
          setLikedInterests((prev) => [...prev, card.id]);
        }
      }
      if (swipeIndex < VIBE_CARDS.length - 1) {
        setSwipeIndex((i) => i + 1);
        setDragOffset(0);
        setExitDirection(null);
      } else {
        saveAndGoToDashboard();
      }
    },
    [swipeIndex, likedInterests, saveAndGoToDashboard]
  );

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    setSwipeIndex(last.index);
    if (last.liked) {
      const cardId = VIBE_CARDS[last.index]?.id;
      if (cardId) {
        setLikedInterests((prev) => prev.filter((id) => id !== cardId));
      }
    }
    setDragOffset(0);
    setExitDirection(null);
  };

  const SWIPE_THRESHOLD = 80;
  const handlePointerDown = (e: React.PointerEvent) => {
    if (exitDirection) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (exitDirection) return;
    const dx = e.clientX - dragStart.current.x;
    setDragOffset(Math.max(-300, Math.min(300, dx)));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (exitDirection) return;
    const dx = e.clientX - dragStart.current.x;
    if (dx > SWIPE_THRESHOLD) {
      setExitDirection("right");
      setTimeout(() => advanceCard(true), 200);
    } else if (dx < -SWIPE_THRESHOLD) {
      setExitDirection("left");
      setTimeout(() => advanceCard(false), 200);
    } else {
      setDragOffset(0);
    }
  };
  const handlePointerLeave = () => {
    if (!exitDirection) setDragOffset(0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!firebaseUser) return null;

  const card = VIBE_CARDS[swipeIndex];
  const total = VIBE_CARDS.length;
  const canUndo = swipeHistory.length > 0;

  const translateX = exitDirection
    ? exitDirection === "right"
      ? 400
      : -400
    : dragOffset;
  const rotation = exitDirection ? 0 : dragOffset * 0.03;

  return (
    <div className="relative flex min-h-screen flex-col px-4 pt-6 pb-8">
      {/* Progress dots */}
      <div className="mb-4 flex justify-center gap-[1px]">
        {VIBE_CARDS.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === swipeIndex ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>

      <Text
        as="h1"
        variant="primary"
        className="mb-1 text-center text-2xl font-bold text-white mx-4"
      >
        What kind of vibe are you all about?
      </Text>
      <Text
        as="p"
        variant="secondary"
        className="mb-4 text-center text-white/80 mx-6"
      >
        Swipe the card right if your taste matches the vibe and left if not
      </Text>

      {canUndo && (
        <div className="absolute right-4 top-40 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUndo();
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/50 bg-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/30"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Undo
          </button>
        </div>
      )}

      {/* Card stack */}
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-16">
        {card && swipeIndex < total - 1 && (
          <div
            className="absolute h-[600px] w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-sm"
            style={{ transform: "scale(0.95)", zIndex: 0 }}
          >
            <div className="relative h-[600px] w-full overflow-hidden rounded-3xl">
              <Image
                src={VIBE_CARDS[swipeIndex + 1].imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
                <p className="text-lg font-medium text-white">
                  {VIBE_CARDS[swipeIndex + 1].label}
                </p>
              </div>
            </div>
          </div>
        )}

        {card && (
          <div
            className="absolute h-[600px] w-full max-w-sm cursor-grab select-none rounded-2xl bg-white/10 backdrop-blur-sm active:cursor-grabbing"
            style={{
              transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
              transition: exitDirection ? "transform 0.2s ease-out" : "none",
              touchAction: "none",
              zIndex: 1,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
          >
            <div className="relative h-[600px] w-full overflow-hidden rounded-2xl">
              <Image
                src={card.imageUrl}
                alt={card.label}
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <p className="text-lg font-medium text-white">{card.label}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
