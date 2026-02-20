"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "@/types";
import { getUser } from "@/lib/firestore-users";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  setSessionCookie: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SOSHLY_ID_TOKEN_KEY = "soshly_id_token";

function setStoredIdToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(SOSHLY_ID_TOKEN_KEY, token);
  else localStorage.removeItem(SOSHLY_ID_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setUser(null);
      return;
    }
    const u = await getUser(firebaseUser.uid);
    setUser(u ?? null);
  }, [firebaseUser]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fb) => {
      setFirebaseUser(fb ?? null);
      if (!fb) setUser(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // After Google redirect sign-in, process the result and set session cookie
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        const idToken = await result.user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (res.ok) setStoredIdToken(idToken);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    let cancelled = false;
    getUser(firebaseUser.uid).then((u) => {
      if (!cancelled) setUser(u ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid]);

  const setSessionCookie = useCallback(async (idToken: string) => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Failed to set session");
    setStoredIdToken(idToken);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await setSessionCookie(idToken);
      await refreshUser();
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }, [setSessionCookie, refreshUser]);

  const signInWithPhone = useCallback(
    async (phoneNumber: string) => {
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-phone", {
        size: "invisible",
      });
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptcha
      );
      await new Promise<void>((resolve, reject) => {
        const code = window.prompt("Enter SMS code");
        if (!code) {
          reject(new Error("No code"));
          return;
        }
        confirmation
          .confirm(code)
          .then(() => resolve())
          .catch(reject);
      });
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) await setSessionCookie(idToken);
      await refreshUser();
    },
    [setSessionCookie, refreshUser]
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    await fetch("/api/auth/session", { method: "DELETE" });
    setStoredIdToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    firebaseUser,
    user,
    loading,
    signInWithGoogle,
    signInWithPhone,
    setSessionCookie,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
