"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getExperience } from "@/lib/firestore-experiences";
import {
  getChatByExperienceId,
  getChatMembers,
  getMessages,
  sendMessage,
} from "@/lib/firestore-chats";
import { getUser } from "@/lib/firestore-users";
import { formatRelativeTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import type { Experience } from "@/types";
import type { Message } from "@/types";
import type { User } from "@/types";

export default function ExperienceChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const experienceId = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User | null>>({});
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getExperience(experienceId)
      .then((ex) => {
        setExperience(ex ?? null);
        return getChatByExperienceId(experienceId);
      })
      .then(async (chat) => {
        if (!chat?.id) return { chatId: null, messages: [], memberIds: [] };
        const [msgs, ids] = await Promise.all([
          getMessages(chat.id),
          getChatMembers(chat.id),
        ]);
        return { chatId: chat.id, messages: msgs, memberIds: ids };
      })
      .then(async ({ chatId: cid, messages: msgs, memberIds }) => {
        setChatId(cid ?? null);
        setMessages(msgs);
        if (memberIds.length === 0) {
          setMemberProfiles({});
          return;
        }
        const profiles = await Promise.all(
          memberIds.map((uid) => getUser(uid))
        );
        const map: Record<string, User | null> = {};
        memberIds.forEach((uid, i) => {
          map[uid] = profiles[i] ?? null;
        });
        setMemberProfiles(map);
      })
      .finally(() => setLoading(false));
  }, [experienceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !chatId || !body.trim()) return;
    setSending(true);
    try {
      await sendMessage(chatId, user.uid, body.trim());
      setBody("");
      const next = await getMessages(chatId);
      setMessages(next);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const displayName = (uid: string) => {
    const u = memberProfiles[uid];
    return u?.nickname || u?.username || u?.fullName || "Someone";
  };

  const avatarUrl = (uid: string) => {
    return memberProfiles[uid]?.photoURL ?? null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200/80 dark:from-sky-950/50 dark:to-sky-900/30">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-100 to-sky-200/80 dark:from-sky-950/50 dark:to-sky-900/30">
        <p className="text-zinc-500">Experience not found.</p>
        <Link href="/dashboard" className="underline text-sky-700 dark:text-sky-300">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const memberIds = Object.keys(memberProfiles).filter((id) => memberProfiles[id]);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title={experience.title}
        backHref={`/experience/${experienceId}`}
      />

      {/* Participant avatars */}
      {chatId && memberIds.length > 0 && (
        <div className="flex shrink-0 justify-start gap-2 border-b border-white/20 bg-transparent px-4 py-2">
          {memberIds.slice(0, 8).map((uid) => (
            <div
              key={uid}
              className="relative h-15 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-white shadow ring-1 ring-black/5 shadow-[inset_0_0_10px_0_rgba(255,255,255,0.4)] dark:border-white/30"
            >
              {avatarUrl(uid) ? (
                <Image
                  src={avatarUrl(uid)!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {displayName(uid).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!chatId ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No chat for this experience.</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No messages yet. Say hi!</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => {
              const isMe = m.userId === user?.uid;
              const name = displayName(m.userId);
              const avatar = avatarUrl(m.userId);
              return (
                <li
                  key={m.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/50 shadow dark:border-white/20">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-sky-300 text-xs font-medium text-sky-900 dark:bg-sky-700 dark:text-sky-100">
                        {name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={`flex min-w-0 max-w-[80%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <p className="mb-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {name}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe
                          ? "rounded-br-md bg-orange-500 text-white dark:bg-orange-600"
                          : "rounded-bl-md bg-white/90 text-zinc-900 backdrop-blur-sm dark:bg-white/20 dark:text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{m.body ?? ""}</p>
                    </div>
                    <p className={`mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 ${isMe ? "text-right" : ""}`}>
                      {formatRelativeTime(m.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {chatId && (
        <form
          onSubmit={handleSend}
          className="flex shrink-0 gap-2 border-t border-white/30 bg-white/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-white/10 dark:bg-black/20"
        >
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="shrink-0 rounded-full bg-orange-500 px-5 py-3 font-medium text-white shadow transition hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
