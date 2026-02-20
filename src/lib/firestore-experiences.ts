import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Experience } from "@/types";
import type { ExperienceStatus } from "./constants";

const EXPERIENCES = "experiences";

function toExperience(id: string, data: Record<string, unknown>): Experience {
  const start = data.startTime;
  const end = data.endTime;
  return {
    id,
    tasteListId: data.tasteListId as string,
    hostId: data.hostId as string,
    title: data.title as string,
    description: data.description as string,
    cover: data.cover as string | undefined,
    agenda: data.agenda as string | undefined,
    duration: data.duration as number | undefined,
    startTime:
      start instanceof Timestamp
        ? start.toDate().toISOString()
        : (start as string),
    endTime:
      end instanceof Timestamp
        ? end.toDate().toISOString()
        : (end as string | undefined),
    location: data.location as Experience["location"],
    maxParticipants: (data.maxParticipants as number) ?? 0,
    seatsRemaining: (data.seatsRemaining as number) ?? 0,
    coinPrice: (data.coinPrice as number) ?? 0,
    status: (data.status as ExperienceStatus) ?? "draft",
    meetingPoint: data.meetingPoint as string | undefined,
    whatToBring: data.whatToBring as string | undefined,
    rules: data.rules as string | undefined,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string),
  };
}

export async function getExperience(id: string): Promise<Experience | null> {
  const ref = doc(db, EXPERIENCES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toExperience(snap.id, snap.data() as Record<string, unknown>);
}

export async function getPublishedExperiences(
  limitCount = 50
): Promise<Experience[]> {
  const now = new Date().toISOString();
  const q = query(
    collection(db, EXPERIENCES),
    where("status", "in", ["published", "full"]),
    where("startTime", ">", now),
    orderBy("startTime"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    toExperience(d.id, d.data() as Record<string, unknown>)
  );
}

export async function createExperience(
  input: Omit<Experience, "id" | "createdAt" | "seatsRemaining">
): Promise<string> {
  const ref = await addDoc(collection(db, EXPERIENCES), {
    ...input,
    seatsRemaining: input.maxParticipants,
    participantsStarted: 0,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateExperienceStatus(
  id: string,
  status: ExperienceStatus
): Promise<void> {
  await updateDoc(doc(db, EXPERIENCES, id), { status });
}

export async function setExperienceChatId(
  experienceId: string,
  chatId: string
): Promise<void> {
  await updateDoc(doc(db, EXPERIENCES, experienceId), { chatId });
}

export async function decrementSeats(experienceId: string): Promise<void> {
  const ref = doc(db, EXPERIENCES, experienceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Experience not found");
  const current = (snap.data().seatsRemaining as number) ?? 0;
  if (current <= 0) throw new Error("No seats left");
  await updateDoc(ref, { seatsRemaining: current - 1 });
}

export async function getExperiencesByHost(
  hostId: string
): Promise<Experience[]> {
  const q = query(
    collection(db, EXPERIENCES),
    where("hostId", "==", hostId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    toExperience(d.id, d.data() as Record<string, unknown>)
  );
}
