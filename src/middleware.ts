import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/session";

const PUBLIC_PATHS = ["/", "/login", "/onboarding"];
const API_PUBLIC_PREFIX = "/api/auth";

/** Static assets in public/ must not go through auth (else /bg.svg etc. get 307 redirect) */
const STATIC_EXT = /\.(svg|png|jpg|jpeg|gif|ico|webp|woff2?|css|js)(\?.*)?$/i;

function isPublic(pathname: string): boolean {
  if (pathname.startsWith(API_PUBLIC_PREFIX)) return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (STATIC_EXT.test(pathname)) {
    return NextResponse.next();
  }
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-soshly-uid", session.uid);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
