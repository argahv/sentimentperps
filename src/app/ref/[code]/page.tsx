"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const REFERRAL_CODE_KEY = "sentimentperps_referral_code";

/**
 * /ref/[code] — Referral landing route
 *
 * Captures the referral code from the URL, persists it in localStorage,
 * then redirects to /dashboard?af=[code] so the Fuul SDK picks up
 * the affiliate param on the first pageview.
 */
export default function ReferralRedirectPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = params.code;
    if (code) {
      try {
        localStorage.setItem(REFERRAL_CODE_KEY, code.toUpperCase());
      } catch {
        // localStorage unavailable (SSR / incognito quota) — continue anyway
      }
      router.replace(`/dashboard?af=${encodeURIComponent(code)}`);
    } else {
      router.replace("/dashboard");
    }
  }, [params.code, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Redirecting...
        </span>
      </div>
    </div>
  );
}
