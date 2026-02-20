"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/tastelists",
    label: "Tastelist",
    activePath: "/tastelists",
    iconSrc: (active: boolean) =>
      active ? "/nav/home_on.svg" : "/nav/home_off.svg",
  },
  {
    href: "/dashboard",
    label: "Location",
    activePath: "/dashboard",
    iconSrc: () => "/nav/location_fill.svg",
  },
  { href: null, label: "Create", isFAB: true },
  {
    href: "/profile",
    label: "Me",
    activePath: "/profile",
    iconSrc: (active: boolean) =>
      active ? "/nav/me_on.svg" : "/nav/me_off.svg",
  },
  {
    href: "/messages",
    label: "Explore",
    activePath: "/messages",
    iconSrc: (active: boolean) =>
      active ? "/nav/exp_on.svg" : "/nav/exp_off.svg",
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

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
        {/* Notch for FAB */}
        <div
          className="absolute top-0 left-1/2 h-4 w-16 -translate-x-1/2 -translate-y-1/2 rounded-b-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.4)",
            borderRight: "1px solid rgba(255,255,255,0.4)",
            borderBottom: "1px solid rgba(255,255,255,0.4)",
          }}
        />
        {navItems.map((item, i) => {
          if (item.isFAB) {
            return (
              <Link
                key={i}
                href="/curate"
                className="relative -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:bg-orange-600 active:scale-95"
                aria-label="Create"
              >
                <svg
                  width="28"
                  height="28"
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
            pathname === item.activePath ||
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
