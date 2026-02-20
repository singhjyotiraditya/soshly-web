import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const BLOCKS = "blocks";
const REPORTS = "reports";

function blockDocId(userId: string, blockedUserId: string): string {
  return [userId, blockedUserId].sort().join("_");
}

export async function blockUser(
  userId: string,
  blockedUserId: string
): Promise<void> {
  await setDoc(doc(db, BLOCKS, blockDocId(userId, blockedUserId)), {
    userId,
    blockedUserId,
    createdAt: new Date().toISOString(),
  });
}

export async function isBlocked(
  userId: string,
  otherUserId: string
): Promise<boolean> {
  const id = blockDocId(userId, otherUserId);
  const snap = await getDoc(doc(db, BLOCKS, id));
  return snap.exists();
}

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason?: string
): Promise<void> {
  await setDoc(doc(collection(db, REPORTS)), {
    reporterId,
    reportedUserId,
    reason: reason ?? "",
    createdAt: new Date().toISOString(),
  });
}
