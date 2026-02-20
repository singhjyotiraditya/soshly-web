"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const isHomeOrLogin = pathname === "/" || pathname === "/login";
    const isOnboarding =
      pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    const isDashboard =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/");

    if (firebaseUser && isHomeOrLogin) {
      const target = user?.onboardingComplete ? "/dashboard" : "/onboarding";
      router.replace(target);
      return;
    }

    if (isOnboarding && user?.onboardingComplete === true) {
      router.replace("/dashboard");
      return;
    }

    if (isDashboard && user && user.onboardingComplete === false) {
      router.replace("/onboarding");
      return;
    }
  }, [loading, firebaseUser, user, pathname, router]);

  return <>{children}</>;
}
