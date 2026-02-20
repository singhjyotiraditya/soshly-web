"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { getTasteListsByOwner } from "@/lib/firestore-tastelists";
import type { TasteList } from "@/types";

export default function TasteListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<TasteList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getTasteListsByOwner(user.uid)
      .then(setLists)
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
          <Link
            href="/tastelists/new"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + New TasteList
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My TasteLists
        </h1>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : lists.length === 0 ? (
          <p className="text-zinc-500">
            No TasteLists yet.{" "}
            <Link href="/tastelists/new" className="underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/tastelists/${list.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {list.coverImage && (
                    <img
                      src={list.coverImage}
                      alt=""
                      className="mb-2 h-32 w-full rounded-lg object-cover"
                    />
                  )}
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {list.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {list.description ?? "No description"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{list.privacy}</p>
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
