"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { getDmThreadsForUser } from "@/lib/firestore-chats";
import { getUser } from "@/lib/firestore-users";

interface ThreadInfo {
  id: string;
  otherUserId: string;
  otherName?: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getDmThreadsForUser(user.uid)
      .then(async (list) => {
        const withNames = await Promise.all(
          list.map(async (t) => {
            const u = await getUser(t.otherUserId);
            return {
              ...t,
              otherName: u?.nickname ?? u?.fullName ?? "User",
            };
          })
        );
        setThreads(withNames);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Soshly
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Messages
        </h1>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="text-zinc-500">No conversations yet.</p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  {t.otherName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
