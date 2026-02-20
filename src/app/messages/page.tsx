"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  getGroupChatsForUser,
  getDmThreadsForUser,
  getLastMessage,
  type ChatListItem,
} from "@/lib/firestore-chats";
import { getExperience } from "@/lib/firestore-experiences";
import { getUser } from "@/lib/firestore-users";

type GroupChatWithCover = ChatListItem & { cover?: string };

type Tab = "groups" | "private";

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("groups");
  const [groupChats, setGroupChats] = useState<GroupChatWithCover[]>([]);
  const [dmChats, setDmChats] = useState<(ChatListItem & { otherName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getGroupChatsForUser(user.uid),
      getDmThreadsForUser(user.uid),
    ])
      .then(async ([groups, dmThreads]) => {
        const withCovers: GroupChatWithCover[] = await Promise.all(
          groups.map(async (g) => {
            if (g.experienceId) {
              const ex = await getExperience(g.experienceId);
              return { ...g, cover: ex?.cover };
            }
            return g;
          })
        );
        setGroupChats(withCovers);
        const withNames = await Promise.all(
          dmThreads.map(async (t) => {
            const last = await getLastMessage(t.id);
            const u = await getUser(t.otherUserId);
            const otherName = u?.nickname ?? u?.fullName ?? "User";
            return {
              id: t.id,
              title: otherName,
              type: "dm" as const,
              otherUserId: t.otherUserId,
              lastMessage: last?.body,
              lastMessageAt: last?.createdAt,
              otherName,
            };
          })
        );
        withNames.sort((a, b) => {
          const ta = a.lastMessageAt ?? "";
          const tb = b.lastMessageAt ?? "";
          return tb.localeCompare(ta);
        });
        setDmChats(withNames);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const list = tab === "groups" ? groupChats : dmChats;
  const emptyMessage =
    tab === "groups"
      ? "No experience groups yet."
      : "No private conversations yet.";

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <PageHeader title="My Chat" backHref="/dashboard" />

      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("groups")}
            className="w-1/2 rounded-[15px] px-4 py-2.5 text-sm font-medium text-white transition"
            style={
              tab === "groups"
                ? {
                    background:
                      "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255, 255, 255, 0.10)",
                    boxShadow:
                      "inset 0 0 16.1px 3px rgba(255, 255, 255, 0.54)",
                  }
                : undefined
            }
          >
            Experience Groups
          </button>
          <button
            type="button"
            onClick={() => setTab("private")}
            className="w-1/2 rounded-[15px] px-4 py-2.5 text-sm font-medium text-white transition"
            style={
              tab === "private"
                ? {
                    background:
                      "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255, 255, 255, 0.10)",
                    boxShadow:
                      "inset 0 0 16.1px 3px rgba(255, 255, 255, 0.54)",
                  }
                : undefined
            }
          >
            Private
          </button>
        </div>

        {loading ? (
          <p className="text-white/70 text-center">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-white/70 text-center">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-white/20 rounded-xl bg-transparent">
            {list.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={
                    chat.type === "group" && chat.experienceId
                      ? `/experience/${chat.experienceId}/chat`
                      : `/messages/${chat.id}`
                  }
                  className="flex items-center gap-4 p-4 transition hover:bg-white/10 hover:rounded-[15px]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20">
                    {chat.type === "group" && (chat as GroupChatWithCover).cover ? (
                      <Image
                        src={(chat as GroupChatWithCover).cover!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-medium text-white">
                        {(chat.title ?? "?").slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {chat.title || "Chat"}
                    </p>
                    <p className="truncate text-sm text-white/80">
                      {chat.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  {chat.lastMessageAt ? (
                    <span className="shrink-0 text-xs text-white/70">
                      {formatRelativeTime(chat.lastMessageAt)}
                    </span>
                  ) : null}
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
