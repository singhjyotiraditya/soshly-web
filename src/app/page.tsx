"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TextInput, Button, Text } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateUser } from "@/lib/firestore-users";
import { auth } from "@/lib/firebase";

export default function Home() {
  const { signInWithGoogle, refreshUser, loading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState({
    nickname: "",
    username: "",
    phone: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({ nickname: "", username: "", phone: "" });
    const trimmedNick = nickname.trim();
    const trimmedUser = username.trim();
    const trimmedPhone = phone.replace(/\D/g, "");
    if (!trimmedNick) {
      setError((prev) => ({ ...prev, nickname: "Please enter a nickname." }));
      return;
    }
    if (!trimmedUser) {
      setError((prev) => ({ ...prev, username: "Please enter a username." }));
      return;
    }
    if (trimmedPhone.length < 10) {
      setError((prev) => ({
        ...prev,
        phone: "Please enter a valid phone number.",
      }));
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "soshly_signup",
        JSON.stringify({
          nickname: trimmedNick,
          username: trimmedUser,
          phone: "+91" + trimmedPhone,
        })
      );
    }
    setSubmitLoading(true);
    try {
      await signInWithGoogle();
      const fbUser = auth.currentUser;
      if (fbUser?.uid) {
        await createOrUpdateUser(fbUser.uid, {
          nickname: trimmedNick,
          username: trimmedUser.toLowerCase(),
          phone: "+91" + trimmedPhone,
          email: fbUser.email ?? undefined,
          onboardingComplete: false,
        });
        await refreshUser();
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError((prev) => ({ ...prev, nickname: "Sign in failed. Try again." }));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Text variant="secondary">Loading…</Text>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="relative flex flex-col items-center mb-8 py-4">
        {/* Left emojis */}
        <span
          className="absolute -left-20 top-0 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0s" }}
          aria-hidden
        >
          <span style={{ transform: "rotate(-12deg)", display: "inline-block" }}>🎭</span>
        </span>
        <span
          className="absolute -left-10 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0.35s" }}
          aria-hidden
        >
          <span style={{ transform: "translateY(-50%) rotate(6deg)", display: "inline-block" }}>🍝</span>
        </span>
        <span
          className="absolute bottom-0 -left-20 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0.7s" }}
          aria-hidden
        >
          <span style={{ transform: "rotate(-6deg)", display: "inline-block" }}>👾</span>
        </span>
        {/* Right emojis */}
        <span
          className="absolute -right-20 top-0 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0.2s" }}
          aria-hidden
        >
          <span style={{ transform: "rotate(15deg)", display: "inline-block" }}>🃏</span>
        </span>
        <span
          className="absolute -right-10 top-1/2 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0.55s" }}
          aria-hidden
        >
          <span style={{ transform: "translateY(-50%) rotate(-8deg)", display: "inline-block" }}>🍺</span>
        </span>
        <span
          className="absolute bottom-0 -right-20 text-2xl sm:text-3xl animate-emoji-pulse"
          style={{ animationDelay: "0.9s" }}
          aria-hidden
        >
          <span style={{ transform: "rotate(5deg)", display: "inline-block" }}>🎳</span>
        </span>
        {/* Center: logo + soshly */}
        <Image
          src="/logo.svg"
          alt="Soshly"
          width={76}
          height={57}
          className="h-12 w-auto sm:h-14"
          priority
        />
        <Text variant="primary" as="h1" className="font-gebuk text-[48px]">
          soshly
        </Text>
      </div>

      <div className="w-full max-w-sm rounded-[30px] border border-white bg-black/[0.07] px-3 pt-9 pb-4 shadow-[inset_0_0_24.6px_7px_rgba(255,255,255,0.25)] backdrop-blur-md sm:p-8">
        <div className="text-center">
          <Text variant="primary" className="mb-1">
            Welcome back!
          </Text>
          <Text variant="secondary" className="mx-4 mb-6">
            Jump right into the buzz around you, tailored to your taste.
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            error={error.nickname}
          />
          <TextInput
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
            error={error.username}
          />
          <TextInput
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            autoComplete="tel"
            error={error.phone}
            prefix="+91 "
            maxLength={10}
          />

          <Button
            type="submit"
            variant="secondary"
            fullWidth
            disabled={submitLoading}
            rightIcon={
              <Image
                src="/google.svg"
                alt=""
                aria-hidden
                width={14}
                height={14}
              />
            }
          >
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
