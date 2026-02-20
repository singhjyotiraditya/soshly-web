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
