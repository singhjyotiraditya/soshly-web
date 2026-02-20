import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "placeholder";
const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "build-placeholder-do-not-use";

const firebaseConfig = {
  apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (projectId !== "placeholder"
      ? `${projectId}.firebaseapp.com`
      : "placeholder.invalid"),
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId !== "placeholder"
      ? `${projectId}.appspot.com`
      : "placeholder.invalid"),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (!getApps().length) {
  try {
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    // Already initialized (e.g. hot reload)
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
