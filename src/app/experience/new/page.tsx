"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  createExperience,
  setExperienceChatId,
} from "@/lib/firestore-experiences";
import { createGroupChatForExperience } from "@/lib/firestore-chats";
import { getTasteList, getTasteListItems } from "@/lib/firestore-tastelists";
import { BaseLayout } from "@/components/BaseLayout";
import { Button } from "@/components/ui/Button";
import { MapPicker } from "@/components/MapPicker";
import { PageHeader } from "@/components/PageHeader";
import { Ripple } from "@/components/Ripple";
import { GeoPoint } from "firebase/firestore";
import type { TasteList, TasteListItem } from "@/types";

interface GeneratedExperience {
  title: string;
  purpose: string;
  description: string;
  startTime: string;
  duration: number;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  costPerPerson: number;
  whatsIncluded: string[];
  whatYoullDo: string[];
  inviteType: string;
  vibeKeywords: string[];
  whatToBring?: string;
  hostNote?: string;
}

interface GeneratedFields {
  title?: string;
  description?: string;
  subtitle?: string;
  agenda?: string;
  durationMinutes?: number;
  meetingPoint?: string;
  maxParticipants?: number;
  coinPrice?: number;
  startTimeOptions?: string[];
  whatToBring?: string;
  rules?: string;
  tags?: string[];
  experience?: GeneratedExperience;
}

interface PersistedDraft {
  step: "preview" | "form";
  title: string;
  purpose: string;
  description: string;
  subtitle: string;
  agenda: string;
  duration: number;
  meetingPoint: string;
  maxParticipants: number;
  coinPrice: number;
  startTime: string;
  inviteType: "ANYONE" | "FOLLOWERS" | "SPECIFIC";
  whatsIncluded: string[];
  whatToBring: string;
  rules: string;
  tags: string[];
  lat: number;
  lng: number;
  coverImage: string;
}

const DRAFT_KEY_PREFIX = "experience-draft-";
const GENERATED_KEY_PREFIX = "experience-generated-";

function getDraftKey(tasteListId: string) {
  return `${DRAFT_KEY_PREFIX}${tasteListId}`;
}

function getGeneratedKey(tasteListId: string) {
  return `${GENERATED_KEY_PREFIX}${tasteListId}`;
}

function NewExperienceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tasteListId = searchParams.get("tastelistId") ?? "";
  const [tasteList, setTasteList] = useState<TasteList | null>(null);
  const [items, setItems] = useState<TasteListItem[]>([]);
  const [step, setStep] = useState<"preview" | "form">("preview");

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [duration, setDuration] = useState(60);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [coinPrice, setCoinPrice] = useState(50);
  const [startTime, setStartTime] = useState("");
  const [inviteType, setInviteType] = useState<
    "ANYONE" | "FOLLOWERS" | "SPECIFIC"
  >("ANYONE");
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>([]);
  const [whatToBring, setWhatToBring] = useState("");
  const [rules, setRules] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [lat, setLat] = useState(40.7128);
  const [lng, setLng] = useState(-74.006);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasGeneratedRef = useRef(false);
  const [showMap, setShowMap] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<
    "envelope" | "note" | "tag" | "note4" | null
  >(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdExperienceId, setCreatedExperienceId] = useState<
    string | null
  >(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const purposeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rulesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const meetingPointTextareaRef = useRef<HTMLTextAreaElement>(null);
  const whatToBringTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight(purposeTextareaRef.current);
    adjustTextareaHeight(descriptionTextareaRef.current);
    adjustTextareaHeight(rulesTextareaRef.current);
    adjustTextareaHeight(titleTextareaRef.current);
    adjustTextareaHeight(meetingPointTextareaRef.current);
    adjustTextareaHeight(whatToBringTextareaRef.current);
  }, [purpose, description, rules, title, meetingPoint, whatToBring]);

  const buildGenerateBody = () => {
    if (!tasteList) return { tasteListContext: "General local experience" };
    const placeItems = items.filter((i) => i.type === "place");
    const hasPlaces = placeItems.length > 0;
    if (!hasPlaces) {
      return {
        tasteListContext: `${tasteList.name}: ${tasteList.description ?? ""}`,
      };
    }
    const places = placeItems.map((p) => ({
      name: p.title,
      address: p.address ?? "",
      lat: p.geo?.latitude ?? null,
      lng: p.geo?.longitude ?? null,
      note: p.tips ?? "",
    }));
    return {
      tasteList: {
        name: tasteList.name,
        description: tasteList.description ?? "",
        places,
      },
    };
  };

  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatStartDisplay = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    const time = `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
    return `${weekday}, ${month} ${day} at ${time}`;
  };

  const formatDurationDisplay = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hrs = Math.round(minutes / 60);
    return hrs === 1 ? "1hr" : `${hrs}hrs`;
  };

  const endTimeDisplay = (() => {
    if (!startTime) return "—";
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) return "—";
    const end = new Date(start.getTime() + duration * 60 * 1000);
    return formatStartDisplay(end.toISOString());
  })();

  const generatedDataToDraft = (data: GeneratedFields): PersistedDraft => {
    const exp = data.experience;
    if (exp) {
      return {
        step: "preview",
        title: exp.title,
        purpose: exp.purpose ?? "",
        description: exp.description ?? "",
        subtitle: exp.location,
        agenda: (exp.whatYoullDo ?? []).join("\n"),
        duration: exp.duration,
        meetingPoint: exp.location,
        maxParticipants: exp.capacity,
        coinPrice: exp.costPerPerson,
        startTime: exp.startTime ? toDatetimeLocal(exp.startTime) : "",
        inviteType:
          (exp.inviteType as "ANYONE" | "FOLLOWERS" | "SPECIFIC") ?? "ANYONE",
        whatsIncluded: Array.isArray(exp.whatsIncluded)
          ? exp.whatsIncluded
          : [],
        whatToBring: exp.whatToBring ?? "",
        rules: exp.hostNote ?? "",
        tags: exp.vibeKeywords ?? [],
        lat: exp.latitude,
        lng: exp.longitude,
        coverImage: "",
      };
    }
    return {
      step: "preview",
      title: data.title ?? "",
      purpose: "",
      description: data.description ?? "",
      subtitle: data.subtitle ?? "",
      agenda: data.agenda ?? "",
      duration: data.durationMinutes ?? 60,
      meetingPoint: data.meetingPoint ?? "",
      maxParticipants: data.maxParticipants ?? 10,
      coinPrice: data.coinPrice ?? 50,
      startTime:
        Array.isArray(data.startTimeOptions) && data.startTimeOptions.length > 0
          ? data.startTimeOptions[0]
          : "",
      inviteType: "ANYONE",
      whatsIncluded: [],
      whatToBring: data.whatToBring ?? "",
      rules: data.rules ?? "",
      tags: data.tags ?? [],
      lat: 40.7128,
      lng: -74.006,
      coverImage: "",
    };
  };

  const applyDraft = (draft: PersistedDraft) => {
    setStep(draft.step);
    setTitle(draft.title);
    setPurpose(draft.purpose);
    setDescription(draft.description);
    setSubtitle(draft.subtitle);
    setAgenda(draft.agenda);
    setDuration(draft.duration);
    setMeetingPoint(draft.meetingPoint);
    setMaxParticipants(draft.maxParticipants);
    setCoinPrice(draft.coinPrice);
    setStartTime(draft.startTime);
    setInviteType(draft.inviteType);
    setWhatsIncluded(draft.whatsIncluded);
    setWhatToBring(draft.whatToBring);
    setRules(draft.rules);
    setTags(draft.tags);
    setLat(draft.lat);
    setLng(draft.lng);
    setCoverImage(draft.coverImage);
  };

  const applyGeneratedData = (data: GeneratedFields) => {
    const exp = data.experience;
    if (exp) {
      setTitle(exp.title);
      setPurpose(exp.purpose ?? "");
      setDescription(exp.description ?? "");
      setSubtitle(exp.location);
      setAgenda((exp.whatYoullDo ?? []).join("\n"));
      setDuration(exp.duration);
      setMeetingPoint(exp.location);
      setMaxParticipants(exp.capacity);
      setCoinPrice(exp.costPerPerson);
      setStartTime(exp.startTime ? toDatetimeLocal(exp.startTime) : "");
      setInviteType(
        (exp.inviteType as "ANYONE" | "FOLLOWERS" | "SPECIFIC") ?? "ANYONE"
      );
      setWhatsIncluded(
        Array.isArray(exp.whatsIncluded) ? exp.whatsIncluded : []
      );
      setWhatToBring(exp.whatToBring ?? "");
      setRules(exp.hostNote ?? "");
      setTags(exp.vibeKeywords ?? []);
      setLat(exp.latitude);
      setLng(exp.longitude);
    } else {
      setPurpose("");
      setWhatsIncluded([]);
      setInviteType("ANYONE");
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.subtitle) setSubtitle(data.subtitle);
      if (data.agenda) setAgenda(data.agenda);
      if (data.durationMinutes) setDuration(data.durationMinutes);
      if (data.meetingPoint) setMeetingPoint(data.meetingPoint);
      if (data.maxParticipants != null)
        setMaxParticipants(data.maxParticipants);
      if (data.coinPrice != null) setCoinPrice(data.coinPrice);
      if (data.whatToBring) setWhatToBring(data.whatToBring);
      if (data.rules) setRules(data.rules);
      if (Array.isArray(data.tags)) setTags(data.tags);
      if (
        Array.isArray(data.startTimeOptions) &&
        data.startTimeOptions.length > 0
      ) {
        setStartTime(data.startTimeOptions[0]);
      }
    }
  };

  // Restore draft immediately when we have tasteListId (before tasteList loads) so refresh doesn't refetch
  useEffect(() => {
    if (!tasteListId) return;
    const draftRaw = sessionStorage.getItem(getDraftKey(tasteListId));
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as PersistedDraft;
        applyDraft(draft);
        hasGeneratedRef.current = true;
      } catch {
        /* invalid draft */
      }
    }
  }, [tasteListId]);

  useEffect(() => {
    if (!tasteListId) {
      router.replace("/experience/select-list");
      return;
    }
    getTasteList(tasteListId)
      .then((l) => {
        setTasteList(l ?? null);
        if (l) return getTasteListItems(l.id);
        return [];
      })
      .then(setItems);
  }, [tasteListId, router]);

  useEffect(() => {
    if (!tasteList || !tasteListId) return;
    if (hasGeneratedRef.current) return;
    const draftKey = getDraftKey(tasteListId);
    const genKey = getGeneratedKey(tasteListId);

    const draftRaw = sessionStorage.getItem(draftKey);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as PersistedDraft;
        applyDraft(draft);
        hasGeneratedRef.current = true;
        return;
      } catch {
        /* invalid draft */
      }
    }

    if (step !== "preview" || hasGeneratedRef.current) return;
    const cached = sessionStorage.getItem(genKey);
    if (cached) {
      try {
        const data = JSON.parse(cached) as GeneratedFields;
        applyGeneratedData(data);
        sessionStorage.removeItem(genKey);
        sessionStorage.setItem(
          draftKey,
          JSON.stringify(generatedDataToDraft(data))
        );
        hasGeneratedRef.current = true;
        return;
      } catch {
        /* invalid cache */
      }
    }
    hasGeneratedRef.current = true;
    let cancelled = false;
    setAiLoading(true);
    fetch("/api/experience/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildGenerateBody()),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Generate failed");
        return res.json() as Promise<GeneratedFields>;
      })
      .then((data) => {
        if (cancelled) return;
        applyGeneratedData(data);
        sessionStorage.setItem(
          draftKey,
          JSON.stringify(generatedDataToDraft(data))
        );
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only run when tasteList/items/tasteListId change - not when step changes (would undo user's "View Experience" click)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasteList, items, tasteListId]);

  useEffect(() => {
    if (!tasteListId || !hasGeneratedRef.current) return;
    const draft: PersistedDraft = {
      step,
      title,
      purpose,
      description,
      subtitle,
      agenda,
      duration,
      meetingPoint,
      maxParticipants,
      coinPrice,
      startTime,
      inviteType,
      whatsIncluded,
      whatToBring,
      rules,
      tags,
      lat,
      lng,
      coverImage,
    };
    const id = setTimeout(() => {
      sessionStorage.setItem(getDraftKey(tasteListId), JSON.stringify(draft));
    }, 300);
    return () => clearTimeout(id);
  }, [
    tasteListId,
    step,
    title,
    purpose,
    description,
    subtitle,
    agenda,
    duration,
    meetingPoint,
    maxParticipants,
    coinPrice,
    startTime,
    inviteType,
    whatsIncluded,
    whatToBring,
    rules,
    tags,
    lat,
    lng,
    coverImage,
  ]);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/experience/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGenerateBody()),
      });
      if (!res.ok) throw new Error("Generate failed");
      const data = (await res.json()) as GeneratedFields;
      applyGeneratedData(data);
      if (tasteListId) {
        sessionStorage.setItem(
          getDraftKey(tasteListId),
          JSON.stringify(generatedDataToDraft(data))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleMapSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", "experiences");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { imgUrl } = (await res.json()) as { imgUrl: string };
      setCoverImage(imgUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeopleError(null);
    setCostError(null);
    setSubmitError(null);

    if (!user?.uid || !title.trim()) {
      setSubmitError("Please enter a title.");
      return;
    }

    let hasError = false;
    if (maxParticipants < 3) {
      setPeopleError("Must be more than 2 (at least 3).");
      hasError = true;
    } else {
      setPeopleError(null);
    }
    if (coinPrice <= 500) {
      setCostError("Must be greater than ₹500.");
      hasError = true;
    } else {
      setCostError(null);
    }
    if (hasError) return;

    const descriptionToSave = [purpose.trim(), description.trim()]
      .filter(Boolean)
      .join("\n\n");
    const start = startTime
      ? new Date(startTime).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(
      new Date(start).getTime() + duration * 60 * 1000
    ).toISOString();
    setSaving(true);
    try {
      const experienceId = await createExperience({
        tasteListId: tasteListId || "none",
        hostId: user.uid,
        title: title.trim(),
        description: descriptionToSave || "",
        cover: coverImage || tasteList?.coverImage,
        agenda:
          (typeof agenda === "string"
            ? agenda
            : Array.isArray(agenda)
              ? (agenda as string[]).join("\n")
              : ""
          ).trim() || undefined,
        duration,
        startTime: start,
        endTime: end,
        location: {
          geo: new GeoPoint(lat, lng),
          address: meetingPoint || undefined,
        },
        maxParticipants,
        coinPrice,
        status: "published",
        meetingPoint: meetingPoint || undefined,
        whatToBring: whatToBring || undefined,
        rules: rules || undefined,
      });
      const chatId = await createGroupChatForExperience(
        experienceId,
        title.trim(),
        user.uid
      );
      await setExperienceChatId(experienceId, chatId);
      if (tasteListId) sessionStorage.removeItem(getDraftKey(tasteListId));
      setCreatedExperienceId(experienceId);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const agendaStr =
    typeof agenda === "string"
      ? agenda
      : Array.isArray(agenda)
        ? (agenda as string[]).join("\n")
        : "";
  const agendaBullets = agendaStr
    .split(/\n|•|-/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (!tasteListId) return null;

  if (tasteListId && !tasteList && !hasGeneratedRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/90">Loading…</p>
      </div>
    );
  }

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

  if (step === "preview" && aiLoading) {
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

  if (step === "preview") {
    return (
      <div className="min-h-screen">
        <PageHeader title="" backHref="/experience/select-list" />
        <main className="mx-auto max-w-md px-4 pb-40">
          <div
            className="overflow-hidden rounded-2xl border border-white/60 bg-white/10 p-4 backdrop-blur-xl"
            style={{
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 16px 3px rgba(255,255,255,0.3) inset",
            }}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              {coverImage || tasteList?.coverImage ? (
                <Image
                  src={coverImage || tasteList!.coverImage!}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                  }}
                />
              )}
            </div>
            <div className="space-y-4 p-4 text-center">
              <div>
                <h2 className="font-gayathri text-4xl font-bold text-white">
                  {title || "Your experience"}
                </h2>
                {subtitle && (
                  <p className="font-gayathri text-md text-white/80">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <span>⏳</span>
                  {duration >= 60
                    ? `${Math.round(duration / 60)} hours`
                    : `${duration} min`}
                </span>
                <span className="text-white/50">•</span>
                <span className="flex items-center gap-1.5">
                  <span>👥</span>
                  {maxParticipants >= 2
                    ? `2-${maxParticipants} people`
                    : `${maxParticipants} people`}
                </span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/50 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {agendaBullets.length > 0 && (
                <div className="border-t border-white/30 pt-4 text-center">
                  <h3 className="mb-3 text-lg font-medium text-white">
                    What you&apos;ll do
                  </h3>
                  <ul className="space-y-2.5 text-left">
                    {agendaBullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="text-sm leading-snug text-white/90"
                      >
                        {bullet.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-20 space-y-3 px-4 pb-6 pt-4">
            <div className="mx-auto max-w-md">
              <Button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                fullWidth
                variant="primary"
                textSize="lg"
                className="rounded-[16px] py-4 active:scale-[0.98]"
              >
                {aiLoading ? "Regenerating…" : "Regenerate"}
              </Button>
              <Button
                onClick={() => setStep("form")}
                disabled={aiLoading}
                fullWidth
                variant="secondary"
                textSize="lg"
                className="mt-3 rounded-[16px] py-4 active:scale-[0.98]"
              >
                View Experience
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Experience" backHref="/experience/select-list" />
      <form onSubmit={handleSubmit}>
        <main className="mx-auto max-w-md px-6 pb-40 pt-2">
          <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl">
            <div className="relative aspect-square w-full">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              {coverImage || tasteList?.coverImage ? (
                <Image
                  src={coverImage || tasteList!.coverImage!}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                  }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-xl bg-black/40 disabled:opacity-50"
              aria-label="Edit cover"
            >
              <Image
                src="/edit_image.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </button>
          </div>

          <div className="mt-4 text-center">
            <h1 className="font-gayathri text-4xl font-bold tracking-tight text-white">
              {title || "Experience"}
            </h1>
            {subtitle ? (
              <p className="font-gayathri text-sm text-white/80">{subtitle}</p>
            ) : null}
            {whatsIncluded.length > 0 ? (
              <div className="mt-4 flex items-center justify-center gap-8 text-3xl">
                {whatsIncluded.slice(0, 3).map((w, idx) => (
                  <span key={`${w}-${idx}`}>{w.trim().split(/\s+/)[0]}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">Event Title</p>
              <textarea
                ref={titleTextareaRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                rows={1}
                required
                className="w-full min-h-[1.5em] resize-none overflow-hidden wrap-break-word bg-transparent text-lg font-medium text-white placeholder:text-white/50 outline-none"
                placeholder="Sip • Play • Chill"
              />
            </div>

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">
                Experience Purpose (Short)
              </p>
              <textarea
                ref={purposeTextareaRef}
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                rows={1}
                className="w-full min-h-[1.5em] resize-none overflow-hidden wrap-break-word bg-transparent text-lg font-medium text-white placeholder:text-white/40 outline-none"
                placeholder="Why are you hosting this?"
              />
            </div>

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">Description</p>
              <textarea
                ref={descriptionTextareaRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                rows={1}
                className="w-full min-h-[1.5em] resize-none overflow-hidden wrap-break-word bg-transparent text-lg font-medium text-white placeholder:text-white/40 outline-none"
                placeholder="What will happen?"
              />
            </div>

            <div className="relative rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <div className="relative pr-8 space-y-4">
                <div
                  className="absolute right-3.5 top-6 bottom-0 w-0 border-l border-dashed border-white"
                  aria-hidden
                />
                <div
                  className="absolute right-2 top-6 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
                  aria-hidden
                />
                <div
                  className="absolute right-2 bottom-0 h-3 w-3 translate-y-1/2 rounded-full bg-white"
                  aria-hidden
                />
                <label className="relative block cursor-pointer">
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <p className="text-xs font-medium text-white/60">Start</p>
                  <p className="text-base font-medium text-white">
                    {formatStartDisplay(startTime) || "—"}
                  </p>
                </label>
                <div>
                  <p className="text-xs font-medium text-white/60">Duration</p>
                  {(() => {
                    const hours =
                      duration >= 60 ? Math.round(duration / 60) : 1;
                    const marginRem = hours < 10 ? 0.875 : 0.5;
                    return (
                      <span className="inline-flex items-baseline text-base font-medium text-white">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={hours}
                          onChange={(e) =>
                            setDuration(
                              Math.max(60, Number(e.target.value) * 60)
                            )
                          }
                          className="w-8 bg-transparent text-base font-medium text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span
                          style={{ marginLeft: `-${marginRem}rem` }}
                        >
                          {hours === 1 ? "hr" : "hrs"}
                        </span>
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60">End</p>
                  <p className="text-base font-medium text-white">
                    {endTimeDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/60">Location</p>
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="text-xs font-medium text-white/80 underline"
                >
                  {showMap ? "Hide map" : "Set on map"}
                </button>
              </div>
              <textarea
                ref={meetingPointTextareaRef}
                value={meetingPoint}
                onChange={(e) => {
                  setMeetingPoint(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                rows={1}
                className="w-full min-h-[1.5em] resize-none overflow-hidden wrap-break-word bg-transparent text-lg font-medium text-white placeholder:text-white/40 outline-none"
                placeholder="Café XYZ, sector 10, chd"
              />
              {showMap ? (
                <div className="mt-2 overflow-hidden rounded-xl">
                  <MapPicker center={{ lat, lng }} onSelect={handleMapSelect} />
                </div>
              ) : null}
            </div>

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">Capacity</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={maxParticipants}
                  onChange={(e) => {
                    setMaxParticipants(Math.max(1, Number(e.target.value)));
                    setPeopleError(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="flex shrink-0 items-center gap-0.75">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxParticipants((n) => Math.max(1, n - 1));
                      setPeopleError(null);
                    }}
                    disabled={maxParticipants <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-transparent text-lg font-medium text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaxParticipants((n) => n + 1);
                      setPeopleError(null);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-transparent text-lg font-medium text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-95"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>
              {peopleError ? (
                <p className="mt-1.5 text-xs text-red-300">{peopleError}</p>
              ) : null}
            </div>
            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">
                Curated Experience Cost (per person)
              </p>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-lg font-medium text-white">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={coinPrice}
                  onChange={(e) => {
                    setCoinPrice(Math.max(0, Number(e.target.value)));
                    setCostError(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCoinPrice((n) => Math.max(0, n - 1));
                      setCostError(null);
                    }}
                    disabled={coinPrice <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-transparent text-lg font-medium text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoinPrice((n) => n + 1);
                      setCostError(null);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-transparent text-lg font-medium text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-95"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-[11px] text-white/45">
                *You earn 65% of the platform earnings from this experience.
              </p>
              {costError ? (
                <p className="mt-1.5 text-xs text-red-400">{costError}</p>
              ) : null}
            </div>

            {whatsIncluded.length > 0 ? (
              <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
                <p className="text-xs font-medium text-white/60">
                  What&apos;s Included (per person)
                </p>
                <div className="mt-2 space-y-2 text-white/90">
                  {whatsIncluded.map((w, idx) => (
                    <p key={`${w}-${idx}`} className="text-base font-medium">
                      {w}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/45">
                  *Items are selected from the venue menu during the experience.
                </p>
              </div>
            ) : null}

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">
                What to Bring (Optional)
              </p>
              <textarea
                ref={whatToBringTextareaRef}
                value={whatToBring}
                onChange={(e) => {
                  setWhatToBring(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                wrap="soft"
                className="min-h-[1.5em] w-full min-w-0 max-w-full resize-none overflow-hidden break-words bg-transparent text-lg font-medium text-white placeholder:text-white/40 outline-none"
                style={{
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
                placeholder="Just yourself and Game spirit !! 😅"
              />
            </div>

            <div className="mx-auto my-6 w-2/4 border-t border-white/50" aria-hidden />

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">
                Host Note (Optional)
              </p>
              <textarea
                ref={rulesTextareaRef}
                value={rules}
                onChange={(e) => {
                  setRules(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                rows={1}
                className="w-full min-h-[1.5em] resize-none overflow-hidden wrap-break-word bg-transparent text-lg font-medium text-white placeholder:text-white/40 outline-none"
                placeholder="Add a note for guests…"
              />
            </div>

            <div className="rounded-[15px] border border-white p-3 bg-[rgba(255,255,255,0.156)] shadow-[inset_4px_0_8px_4px_rgba(255,255,255,0)]">
              <p className="text-xs font-medium text-white/60">
                Host Note Card (Optional)
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote((s) => (s === "envelope" ? null : "envelope"))
                  }
                  className="rounded-lg transition-all duration-200"
                >
                  <Image
                    src="/notes/envelope.png"
                    alt=""
                    width={65}
                    height={65}
                    className={`h-[65px] w-[65px] object-contain opacity-90 transition-all duration-200 ${selectedNote === "envelope" ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote((s) => (s === "note" ? null : "note"))
                  }
                  className="rounded-lg transition-all duration-200"
                >
                  <Image
                    src="/notes/note.png"
                    alt=""
                    width={65}
                    height={65}
                    className={`h-[65px] w-[65px] object-contain opacity-90 transition-all duration-200 ${selectedNote === "note" ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote((s) => (s === "tag" ? null : "tag"))
                  }
                  className="rounded-lg transition-all duration-200"
                >
                  <Image
                    src="/notes/tag.png"
                    alt=""
                    width={65}
                    height={65}
                    className={`h-[65px] w-[65px] object-contain opacity-90 transition-all duration-200 ${selectedNote === "tag" ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote((s) => (s === "note4" ? null : "note4"))
                  }
                  className="rounded-lg transition-all duration-200"
                >
                  <Image
                    src="/notes/note4.png"
                    alt="Keep it simple"
                    width={65}
                    height={65}
                    className={`h-[65px] w-[65px] object-contain opacity-90 transition-all duration-200 ${selectedNote === "note4" ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4">
          <div className="mx-auto max-w-md">
            <Button
              type="submit"
              fullWidth
              variant="secondary"
              textSize="lg"
              disabled={saving}
              className="rounded-[18px] py-4 active:scale-[0.98]"
            >
              {saving ? "Curating…" : "Curate Experience"}
            </Button>
            {submitError ? (
              <p className="mt-2 text-center text-sm text-red-400">
                {submitError}
              </p>
            ) : null}
          </div>
        </div>
      </form>

      {createdExperienceId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          aria-modal
          role="dialog"
        >
          <div className="w-full max-w-[360px] rounded-2xl border border-white/30 bg-white/10 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Image
                src="/nav/exp_off.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0"
              />
              <h2 className="text-xl font-normal text-white">
                Event Created
              </h2>
            </div>
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl">
              {coverImage || tasteList?.coverImage ? (
                <Image
                  src={coverImage || tasteList!.coverImage!}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(319deg, #BAD5FF -12.2%, #FFBBF4 30.15%, #6CEF55 124.13%)",
                  }}
                />
              )}
            </div>
            <p className="font-gayathri mt-4 text-center text-lg font-semibold text-white">
              {title || "Experience"}
            </p>
            <p className="font-gayathri mt-1 text-center text-sm text-white/70">
              {meetingPoint || subtitle || "—"}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/experience/${createdExperienceId}`
                      : "";
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: title || "Experience",
                        text: meetingPoint || subtitle || "",
                        url,
                      });
                    } catch {
                      await navigator.clipboard?.writeText(url);
                    }
                  } else {
                    await navigator.clipboard?.writeText(url);
                  }
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 py-2.5 text-base font-medium text-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.59 13.51 6.82 3.98" />
                  <path d="M15.41 6.51l-6.82 3.98" />
                </svg>
                Share
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedExperienceId(null);
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="rounded-xl bg-black py-2.5 text-base font-medium text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NewExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/90">Loading…</p>
        </div>
      }
    >
      <NewExperienceForm />
    </Suspense>
  );
}
