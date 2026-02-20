"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getMessages, sendMessage } from "@/lib/firestore-chats";
import { formatTime } from "@/lib/format";
import { getUser } from "@/lib/firestore-users";
import { blockUser } from "@/lib/firestore-blocks";
import type { Message } from "@/types";

export default function DmChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const threadId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages(threadId)
      .then((msgs) => {
        setMessages(msgs);
        const otherUserId = msgs.find((m) => m.userId !== user?.uid)?.userId;
        if (otherUserId) return getUser(otherUserId);
        return null;
      })
      .then((u) => setOtherName(u?.nickname ?? u?.fullName ?? "User"))
      .finally(() => setLoading(false));
  }, [threadId, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !body.trim()) return;
    setSending(true);
    try {
      await sendMessage(threadId, user.uid, body.trim());
      setBody("");
      const next = await getMessages(threadId);
      setMessages(next);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    const otherUserId = messages.find((m) => m.userId !== user?.uid)?.userId;
    if (!user?.uid || !otherUserId) return;
    if (!confirm("Block this user?")) return;
    await blockUser(user.uid, otherUserId);
    window.history.back();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/messages"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          ← {otherName}
        </Link>
        <button
          type="button"
          onClick={handleBlock}
          className="text-sm text-red-600 dark:text-red-400"
        >
          Block
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-zinc-500">No messages yet.</p>
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
    </div>
  );
}
