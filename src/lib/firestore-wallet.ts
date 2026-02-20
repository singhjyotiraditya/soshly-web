import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Transaction, Ticket } from "@/types";

const TRANSACTIONS = "transactions";
const USERS = "users";
const ESCROWS = "escrows";
const EXPERIENCES = "experiences";
const TICKETS = "tickets";
const CHATS = "chats";
const CHAT_MEMBERS = "chatMembers";

export async function getTransactionsForUser(
  userId: string,
  limitCount = 100
): Promise<Transaction[]> {
  const q = query(
    collection(db, TRANSACTIONS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt;
    return {
      id: d.id,
      userId: data.userId as string,
      type: data.type as Transaction["type"],
      amount: data.amount as number,
      experienceId: data.experienceId as string | undefined,
      ticketId: data.ticketId as string | undefined,
      createdAt:
        createdAt instanceof Timestamp
          ? createdAt.toDate().toISOString()
          : (createdAt as string),
    };
  });
}

export async function getTicketForUserAndExperience(
  experienceId: string,
  userId: string
): Promise<Ticket | null> {
  const q = query(
    collection(db, TICKETS),
    where("experienceId", "==", experienceId),
    where("userId", "==", userId),
    limit(1)
  );
  const snap = await getDocs(q);
  const ticketDoc = snap.docs[0];
  if (!ticketDoc?.exists()) return null;
  const data = ticketDoc.data();
  const createdAt = data.createdAt;
  return {
    id: ticketDoc.id,
    experienceId: data.experienceId as string,
    userId: data.userId as string,
    ticketId: data.ticketId as string,
    status: data.status as Ticket["status"],
    createdAt:
      createdAt instanceof Timestamp
        ? createdAt.toDate().toISOString()
        : (createdAt as string),
  };
}

export async function getBalance(userId: string): Promise<number> {
  const q = query(collection(db, TRANSACTIONS), where("userId", "==", userId));
  const snap = await getDocs(q);
  let balance = 0;
  snap.docs.forEach((d) => {
    balance += (d.data().amount as number) ?? 0;
  });
  return balance;
}

export async function joinExperience(
  experienceId: string,
  userId: string
): Promise<{ ticketId: string; chatId: string }> {
  return runTransaction(db, async (tx) => {
    const expRef = doc(db, EXPERIENCES, experienceId);
    const expSnap = await tx.get(expRef);
    if (!expSnap.exists()) throw new Error("Experience not found");
    const exp = expSnap.data();
    const status = exp.status as string;
    const seatsRemaining = (exp.seatsRemaining as number) ?? 0;
    const coinPrice = (exp.coinPrice as number) ?? 0;
    if (status !== "published" && status !== "full")
      throw new Error("Experience not joinable");
    if (seatsRemaining <= 0) throw new Error("No seats left");

    const userRef = doc(db, USERS, userId);
    const userSnap = await tx.get(userRef);
    const balance = userSnap.exists()
      ? ((userSnap.data().walletBalance as number) ?? 0)
      : 0;
    if (balance < coinPrice) throw new Error("Insufficient balance");

    const escrowRef = doc(db, ESCROWS, experienceId);
    const escrowSnap = await tx.get(escrowRef);
    const currentTotal = escrowSnap.exists()
      ? ((escrowSnap.data().totalCoins as number) ?? 0)
      : 0;

    const now = new Date().toISOString();
    const ticketId = `T${Date.now()}-${userId.slice(0, 8)}`;

    tx.set(doc(collection(db, TRANSACTIONS)), {
      userId,
      type: "join_escrow",
      amount: -coinPrice,
      experienceId,
      ticketId,
      createdAt: now,
    });

    tx.set(escrowRef, {
      experienceId,
      totalCoins: currentTotal + coinPrice,
      released: false,
    });

    tx.update(expRef, {
      seatsRemaining: seatsRemaining - 1,
      ...(seatsRemaining - 1 === 0 ? { status: "full" } : {}),
    });

    tx.update(userRef, {
      walletBalance: balance - coinPrice,
    });

    const ticketRef = doc(collection(db, TICKETS));
    tx.set(ticketRef, {
      experienceId,
      userId,
      ticketId,
      status: "active",
      createdAt: now,
    });

    const chatId = (exp.chatId as string) ?? "";
    if (chatId) {
      tx.set(doc(collection(db, CHAT_MEMBERS)), {
        chatId,
        userId,
        joinedAt: now,
      });
    }

    return { ticketId, chatId };
  });
}
