import type { GeoPoint } from "firebase/firestore";
import type { ExperienceStatus, Persona } from "@/lib/constants";

export interface User {
  uid: string;
  phone?: string;
  email?: string;
  fullName?: string;
  nickname?: string;
  username?: string;
  photoURL?: string;
  persona?: Persona;
  interests?: string[];
  geo?: GeoPoint;
  walletBalance?: number;
  onboardingComplete?: boolean;
  createdAt?: ReturnType<Date["toISOString"]>;
  updatedAt?: ReturnType<Date["toISOString"]>;
}

export interface TasteList {
  id: string;
  ownerId: string;
  name: string;
  coverImage?: string;
  description?: string;
  tags: string[];
  privacy: "public" | "private" | "unlisted";
  remixedFromId?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export type TasteListItemType = "place" | "post";

export interface TasteListItem {
  id: string;
  tasteListId: string;
  type: TasteListItemType;
  geo?: GeoPoint;
  title: string;
  description?: string;
  tips?: string;
  photos: string[];
  placeId?: string;
  address?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export interface Experience {
  id: string;
  tasteListId: string;
  hostId: string;
  title: string;
  description: string;
  cover?: string;
  agenda?: string;
  duration?: number;
  startTime: ReturnType<Date["toISOString"]>;
  endTime?: ReturnType<Date["toISOString"]>;
  location: { geo: GeoPoint; placeId?: string; address?: string };
  maxParticipants: number;
  seatsRemaining: number;
  coinPrice: number;
  status: ExperienceStatus;
  meetingPoint?: string;
  whatToBring?: string;
  rules?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export interface Ticket {
  id: string;
  experienceId: string;
  userId: string;
  ticketId: string;
  status: "active" | "checked_in" | "used";
  createdAt: ReturnType<Date["toISOString"]>;
}

export type TransactionType =
  | "signup_bonus"
  | "join_escrow"
  | "escrow_release"
  | "refund";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  experienceId?: string;
  ticketId?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export interface Escrow {
  experienceId: string;
  totalCoins: number;
  released: boolean | ReturnType<Date["toISOString"]>;
}

export interface Chat {
  id: string;
  experienceId?: string;
  type: "group" | "dm";
  title?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export interface ChatMember {
  chatId: string;
  userId: string;
  joinedAt: ReturnType<Date["toISOString"]>;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  body?: string;
  imageURL?: string;
  createdAt: ReturnType<Date["toISOString"]>;
}

export interface Session {
  uid: string;
  token: string;
  expiresAt: ReturnType<Date["toISOString"]>;
}
