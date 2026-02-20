"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    activePath: "/dashboard",
    iconSrc: (active: boolean) =>
      active ? "/nav/home_on.svg" : "/nav/home_off.svg",
  },
  {
    href: "/nearby",
    label: "Nearby",
    activePath: "/nearby",
    iconSrc: (active: boolean) =>
      active ? "/nav/location_fill.svg" : "/nav/location_fill.svg",
  },
  { href: null, label: "Create", isFAB: true },
  {
    href: "/profile",
    label: "Profile",
    activePath: "/profile",
    activeQueryExclude: "tab=experience",
    iconSrc: (active: boolean) =>
      active ? "/nav/me_on.svg" : "/nav/me_off.svg",
  },
  {
    href: "/experiences",
    label: "My experiences",
    activePath: "/experiences",
    iconSrc: (active: boolean) =>
      active ? "/nav/exp_on.svg" : "/nav/exp_off.svg",
  },
];

function BottomNavContent() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 pt-2">
      <div
        className="relative flex h-15 w-full max-w-sm items-center justify-around rounded-full px-2 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {navItems.map((item, i) => {
          if (item.isFAB) {
            return (
              <Link
                key={i}
                href="/curate"
                className="relative -mt-14 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition hover:opacity-95 active:scale-95"
                style={{
                  background:
                    "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  boxShadow:
                    "0 0 16px 3px rgba(255,255,255,0.3) inset, 0 4px 12px rgba(0,0,0,0.15)",
                }}
                aria-label="Create"
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Link>
            );
          }
          const active =
            "activeQuery" in item && item.activeQuery
              ? pathname === item.activePath &&
                searchParams?.get("tab") === (item.activeQuery as string).split("=")[1]
              : "activeQueryExclude" in item && item.activeQueryExclude
                ? pathname === item.activePath &&
                  searchParams?.get("tab") !== (item.activeQueryExclude as string).split("=")[1]
                : pathname === item.activePath ||
                  pathname.startsWith(item.activePath + "/");
          const content =
            "iconSrc" in item && item.iconSrc ? (
              <Image
                src={item.iconSrc(active)}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            ) : null;
          return (
            <Link
              key={i}
              href={item.href!}
              className="flex flex-1 items-center justify-center transition active:scale-95"
              aria-label={item.label}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function BottomNavFallback() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 pt-2">
      <div
        className="relative flex h-15 w-full max-w-sm items-center justify-around rounded-full px-2 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {navItems.map((item, i) =>
          item.isFAB ? (
            <Link
              key={i}
              href="/curate"
              className="relative -mt-14 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
              style={{
                background:
                  "linear-gradient(111deg, #F35100 5.96%, #FE9764 112.68%), rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.4)",
                boxShadow:
                  "0 0 16px 3px rgba(255,255,255,0.3) inset, 0 4px 12px rgba(0,0,0,0.15)",
              }}
              aria-label="Create"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          ) : (
            <Link
              key={i}
              href={item.href!}
              className="flex flex-1 items-center justify-center"
              aria-label={item.label}
            >
              {"iconSrc" in item && item.iconSrc ? (
                <Image
                  src={item.iconSrc(false)}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              ) : null}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavFallback />}>
      <BottomNavContent />
    </Suspense>
  );
}
