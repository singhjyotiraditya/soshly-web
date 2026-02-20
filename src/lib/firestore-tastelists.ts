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
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { TasteList, TasteListItem } from "@/types";

const TASTE_LISTS = "tasteLists";
const TASTE_LIST_ITEMS = "tasteListItems";

function toTasteList(id: string, data: Record<string, unknown>): TasteList {
  return {
    id,
    ownerId: data.ownerId as string,
    name: data.name as string,
    coverImage: data.coverImage as string | undefined,
    description: data.description as string | undefined,
    tags: (data.tags as string[]) ?? [],
    privacy: (data.privacy as TasteList["privacy"]) ?? "public",
    remixedFromId: data.remixedFromId as string | undefined,
    createdAt: data.createdAt as string,
  };
}

function toTasteListItem(
  id: string,
  data: Record<string, unknown>
): TasteListItem {
  return {
    id,
    tasteListId: data.tasteListId as string,
    type: data.type as TasteListItem["type"],
    title: data.title as string,
    description: data.description as string | undefined,
    tips: data.tips as string | undefined,
    photos: (data.photos as string[]) ?? [],
    placeId: data.placeId as string | undefined,
    address: data.address as string | undefined,
    geo: data.geo as TasteListItem["geo"],
    createdAt: data.createdAt as string,
  };
}

export async function getTasteList(id: string): Promise<TasteList | null> {
  const ref = doc(db, TASTE_LISTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toTasteList(snap.id, snap.data() as Record<string, unknown>);
}

export async function getTasteListsByOwner(
  ownerId: string
): Promise<TasteList[]> {
  const q = query(
    collection(db, TASTE_LISTS),
    where("ownerId", "==", ownerId),
    limit(100)
  );
  const snap = await getDocs(q);
  const lists = snap.docs.map((d) =>
    toTasteList(d.id, d.data() as Record<string, unknown>)
  );
  lists.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return lists;
}

/** Public tastelists owned by other users (excludes currentUserId). */
export async function getPublicTasteListsFromOthers(
  currentUserId: string | null,
  limitCount = 20
): Promise<TasteList[]> {
  const q = query(
    collection(db, TASTE_LISTS),
    where("privacy", "==", "public"),
    limit(100)
  );
  const snap = await getDocs(q);
  let lists = snap.docs.map((d) =>
    toTasteList(d.id, d.data() as Record<string, unknown>)
  );
  if (currentUserId) {
    lists = lists.filter((l) => l.ownerId !== currentUserId);
  }
  lists.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return lists.slice(0, limitCount);
}

/** Place items from other users' public tastelists (for recommendations). */
export async function getPlaceItemsFromOtherTastelists(
  currentUserId: string | null,
  limitCount = 12
): Promise<TasteListItem[]> {
  const lists = await getPublicTasteListsFromOthers(currentUserId, 8);
  const itemArrays = await Promise.all(
    lists.map((l) => getTasteListItems(l.id))
  );
  const places = itemArrays
    .flat()
    .filter((item) => item.type === "place")
    .slice(0, limitCount);
  return places;
}

export async function createTasteList(
  input: Omit<TasteList, "id" | "createdAt">
): Promise<string> {
  const data: Record<string, unknown> = {
    ...input,
    createdAt: new Date().toISOString(),
  };
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  const ref = await addDoc(collection(db, TASTE_LISTS), cleaned);
  return ref.id;
}

export async function updateTasteList(
  id: string,
  data: Partial<Omit<TasteList, "id" | "ownerId" | "createdAt">>
): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined
    )
  );
  if (Object.keys(cleaned).length === 0) return;
  await updateDoc(doc(db, TASTE_LISTS, id), cleaned);
}

export async function deleteTasteList(id: string): Promise<void> {
  await deleteDoc(doc(db, TASTE_LISTS, id));
}

export async function getTasteListItems(
  tasteListId: string
): Promise<TasteListItem[]> {
  const q = query(
    collection(db, TASTE_LIST_ITEMS),
    where("tasteListId", "==", tasteListId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    toTasteListItem(d.id, d.data() as Record<string, unknown>)
  );
}

/** Remove undefined values; Firestore does not accept undefined. */
function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

export async function addTasteListItem(
  input: Omit<TasteListItem, "id" | "createdAt">
): Promise<string> {
  const data = omitUndefined({
    ...input,
    createdAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, TASTE_LIST_ITEMS), data);
  return ref.id;
}

export async function remixTasteList(
  sourceId: string,
  ownerId: string,
  name?: string
): Promise<string> {
  const source = await getTasteList(sourceId);
  if (!source) throw new Error("TasteList not found");
  const items = await getTasteListItems(sourceId);
  const newId = await createTasteList({
    ownerId,
    name: name ?? `${source.name} (remix)`,
    coverImage: source.coverImage,
    description: source.description,
    tags: source.tags,
    privacy: source.privacy,
    remixedFromId: sourceId,
  });
  for (const item of items) {
    await addTasteListItem({
      tasteListId: newId,
      type: item.type,
      title: item.title,
      description: item.description,
      tips: item.tips,
      photos: item.photos,
      placeId: item.placeId,
      address: item.address,
      geo: item.geo,
    });
  }
  return newId;
}
