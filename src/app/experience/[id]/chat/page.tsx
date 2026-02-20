"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getExperience } from "@/lib/firestore-experiences";
import {
  getChatByExperienceId,
  getMessages,
  sendMessage,
} from "@/lib/firestore-chats";
import { formatTime } from "@/lib/format";
import type { Experience } from "@/types";
import type { Message } from "@/types";

export default function ExperienceChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const experienceId = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
      .then((chat) => {
        setChatId(chat?.id ?? null);
        if (chat?.id) return getMessages(chat.id);
        return [];
      })
      .then(setMessages)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Experience not found.</p>
        <Link href="/dashboard" className="ml-2 underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={`/experience/${experienceId}`}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          ← {experience.title}
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!chatId ? (
          <p className="text-zinc-500">No chat for this experience.</p>
        ) : messages.length === 0 ? (
          <p className="text-zinc-500">No messages yet. Say hi!</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.userId === user?.uid
                    ? "ml-auto max-w-[80%] rounded-lg bg-zinc-900 px-3 py-2 text-right text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "max-w-[80%] rounded-lg bg-zinc-200 px-3 py-2 dark:bg-zinc-700 dark:text-zinc-100"
                }
              >
                <p className="text-sm">{m.body}</p>
                <p className="mt-1 text-xs opacity-70">
                  {formatTime(m.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
      {chatId && (
        <form
          onSubmit={handleSend}
          className="flex shrink-0 gap-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-full bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
