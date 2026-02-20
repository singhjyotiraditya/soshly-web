import { doc, setDoc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "@/types";
import { SIGNUP_BONUS_COINS } from "./constants";

const USERS = "users";
const TRANSACTIONS = "transactions";

export async function getUser(uid: string): Promise<User | null> {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return { uid: snap.id, ...d } as User;
}

export async function createOrUpdateUser(
  uid: string,
  data: Partial<User> & { phone?: string; email?: string }
): Promise<void> {
  const { phone, email, ...rest } = data;
  const userRef = doc(db, USERS, uid);
  const now = new Date().toISOString();
  const existing = await getDoc(userRef);
  const isNew = !existing.exists();
  const payload = {
    ...(existing.exists() ? existing.data() : {}),
    ...rest,
    uid,
    updatedAt: now,
  } as Record<string, unknown>;
  if (phone !== undefined) payload.phone = phone;
  if (email !== undefined) payload.email = email;
  if (isNew) payload.createdAt = now;
  if (isNew) payload.walletBalance = SIGNUP_BONUS_COINS;
  await setDoc(userRef, payload);

  if (isNew) {
    await addDoc(collection(db, TRANSACTIONS), {
      userId: uid,
      type: "signup_bonus",
      amount: SIGNUP_BONUS_COINS,
      createdAt: now,
    });
  }
}
