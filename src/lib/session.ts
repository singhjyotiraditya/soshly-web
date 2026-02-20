import * as jose from "jose";
import { SESSION_COOKIE_MAX_AGE_DAYS, SESSION_COOKIE_NAME } from "./constants";

const SECRET = process.env.SESSION_SECRET;
const ALG = "HS256";

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export async function createSessionToken(uid: string): Promise<string> {
  if (!SECRET) throw new Error("SESSION_SECRET not set");
  const secret = new TextEncoder().encode(SECRET);
  const exp =
    Math.floor(Date.now() / 1000) + SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  return new jose.SignJWT({ uid })
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<{ uid: string } | null> {
  if (!SECRET) return null;
  try {
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const uid = payload.uid as string;
    return uid ? { uid } : null;
  } catch {
    return null;
  }
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
}
