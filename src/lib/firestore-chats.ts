import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Message } from "@/types";

const CHATS = "chats";
const CHAT_MEMBERS = "chatMembers";
const MESSAGES = "messages";

export async function createGroupChatForExperience(
  experienceId: string,
  title: string,
  hostId: string
): Promise<string> {
  const ref = await addDoc(collection(db, CHATS), {
    experienceId,
    type: "group",
    title,
    createdAt: new Date().toISOString(),
  });
  await addDoc(collection(db, CHAT_MEMBERS), {
    chatId: ref.id,
    userId: hostId,
    joinedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function addChatMember(
  chatId: string,
  userId: string
): Promise<void> {
  await addDoc(collection(db, CHAT_MEMBERS), {
    chatId,
    userId,
    joinedAt: new Date().toISOString(),
  });
}

export async function getChatByExperienceId(
  experienceId: string
): Promise<{ id: string } | null> {
  const q = query(
    collection(db, CHATS),
    where("experienceId", "==", experienceId),
    limit(1)
  );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? { id: first.id } : null;
}

export async function getChatMembers(chatId: string): Promise<string[]> {
  const q = query(collection(db, CHAT_MEMBERS), where("chatId", "==", chatId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().userId as string);
}

export async function getMessages(
  chatId: string,
  limitCount = 100
): Promise<Message[]> {
  const q = query(
    collection(db, MESSAGES),
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt;
    return {
      id: d.id,
      chatId: data.chatId as string,
      userId: data.userId as string,
      body: data.body as string | undefined,
      imageURL: data.imageURL as string | undefined,
      createdAt:
        createdAt instanceof Timestamp
          ? createdAt.toDate().toISOString()
          : (createdAt as string),
    };
  });
}

export async function sendMessage(
  chatId: string,
  userId: string,
  body?: string,
  imageURL?: string
): Promise<string> {
  const ref = await addDoc(collection(db, MESSAGES), {
    chatId,
    userId,
    ...(body && { body }),
    ...(imageURL && { imageURL }),
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

const DM_THREADS = "dmThreads";

function dmThreadId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export async function getOrCreateDmThread(
  userId1: string,
  userId2: string
): Promise<string> {
  const id = dmThreadId(userId1, userId2);
  const ref = doc(db, DM_THREADS, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return id;
  const [id1, id2] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  await setDoc(ref, {
    participantIds: [id1, id2],
    type: "dm",
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getDmThreadsForUser(
  userId: string
): Promise<{ id: string; otherUserId: string }[]> {
  const q = query(
    collection(db, DM_THREADS),
    where("participantIds", "array-contains", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const ids = d.data().participantIds as string[];
    const other = ids.find((id: string) => id !== userId) ?? ids[0];
    return { id: d.id, otherUserId: other };
  });
}

export interface ChatListItem {
  id: string;
  title: string;
  type: "group" | "dm";
  experienceId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  otherUserId?: string;
}

export async function getLastMessage(
  chatId: string
): Promise<{ body?: string; createdAt: string } | null> {
  const q = query(
    collection(db, MESSAGES),
    where("chatId", "==", chatId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  const d = snap.docs[0];
  if (!d) return null;
  const data = d.data();
  const createdAt = data.createdAt;
  return {
    body: data.body as string | undefined,
    createdAt:
      createdAt instanceof Timestamp
        ? createdAt.toDate().toISOString()
        : (createdAt as string),
  };
}

/** All group chats the user is a member of (experience groups). */
export async function getGroupChatsForUser(
  userId: string
): Promise<ChatListItem[]> {
  const memberQ = query(
    collection(db, CHAT_MEMBERS),
    where("userId", "==", userId)
  );
  const memberSnap = await getDocs(memberQ);
  const chatIds = [...new Set(memberSnap.docs.map((d) => d.data().chatId as string))];
  if (chatIds.length === 0) return [];

  const results: ChatListItem[] = [];
  for (const chatId of chatIds) {
    const chatRef = doc(db, CHATS, chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) continue;
    const data = chatSnap.data();
    const type = (data.type as string) ?? "group";
    if (type !== "group") continue;
    const last = await getLastMessage(chatId);
    results.push({
      id: chatId,
      title: (data.title as string) ?? "Group",
      type: "group",
      experienceId: data.experienceId as string | undefined,
      lastMessage: last?.body,
      lastMessageAt: last?.createdAt,
    });
  }
  results.sort((a, b) => {
    const ta = a.lastMessageAt ?? "";
    const tb = b.lastMessageAt ?? "";
    return tb.localeCompare(ta);
  });
  return results;
}

/** All chats for the user: experience groups + DM threads, with last message. */
export async function getAllChatsForUser(
  userId: string
): Promise<ChatListItem[]> {
  const [groupChats, dmThreads] = await Promise.all([
    getGroupChatsForUser(userId),
    getDmThreadsForUser(userId),
  ]);
  const dmList: ChatListItem[] = await Promise.all(
    dmThreads.map(async (t) => {
      const last = await getLastMessage(t.id);
      return {
        id: t.id,
        title: "", // filled by caller with other user's name
        type: "dm" as const,
        otherUserId: t.otherUserId,
        lastMessage: last?.body,
        lastMessageAt: last?.createdAt,
      };
    })
  );
  return [...groupChats, ...dmList];
}
