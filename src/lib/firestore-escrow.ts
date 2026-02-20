import {
  doc,
  getDocs,
  query,
  where,
  collection,
  runTransaction,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

const ESCROWS = "escrows";
const EXPERIENCES = "experiences";
const TRANSACTIONS = "transactions";
const TICKETS = "tickets";
const USERS = "users";

export async function markTicketStarted(
  experienceId: string,
  userId: string
): Promise<void> {
  const ticketsRef = collection(db, TICKETS);
  const q = query(
    ticketsRef,
    where("experienceId", "==", experienceId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const ticketDoc = snap.docs[0];
  if (!ticketDoc) throw new Error("Ticket not found");
  const expRef = doc(db, EXPERIENCES, experienceId);
  await runTransaction(db, async (tx) => {
    tx.update(ticketDoc.ref, {
      started: true,
      startedAt: new Date().toISOString(),
    });
    tx.update(expRef, { participantsStarted: increment(1) });
  });
}

export async function getStartedCount(experienceId: string): Promise<number> {
  const q = query(
    collection(db, TICKETS),
    where("experienceId", "==", experienceId),
    where("started", "==", true)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function releaseEscrowIfThreshold(
  experienceId: string,
  thresholdRatio: number = 1
): Promise<boolean> {
  return runTransaction(db, async (tx) => {
    const expRef = doc(db, EXPERIENCES, experienceId);
    const expSnap = await tx.get(expRef);
    if (!expSnap.exists()) throw new Error("Experience not found");
    const exp = expSnap.data();
    const hostId = exp.hostId as string;
    const status = exp.status as string;
    if (status !== "full" && status !== "published") return false;

    const participantsStarted = (exp.participantsStarted as number) ?? 0;
    const maxParticipants = (exp.maxParticipants as number) ?? 0;
    const threshold = Math.ceil(maxParticipants * thresholdRatio);
    if (participantsStarted < threshold) return false;

    const escrowRef = doc(db, ESCROWS, experienceId);
    const escrowSnap = await tx.get(escrowRef);
    if (!escrowSnap.exists()) return false;
    const escrowData = escrowSnap.data();
    if (escrowData.released === true) return false;
    const totalCoins = (escrowData.totalCoins as number) ?? 0;

    const now = new Date().toISOString();
    tx.set(doc(collection(db, TRANSACTIONS)), {
      userId: hostId,
      type: "escrow_release",
      amount: totalCoins,
      experienceId,
      createdAt: now,
    });

    const userRef = doc(db, USERS, hostId);
    const userSnap = await tx.get(userRef);
    const currentBalance = userSnap.exists()
      ? ((userSnap.data().walletBalance as number) ?? 0)
      : 0;
    tx.update(userRef, { walletBalance: currentBalance + totalCoins });

    tx.update(escrowRef, { released: true });
    tx.update(expRef, { status: "started" });

    return true;
  });
}
