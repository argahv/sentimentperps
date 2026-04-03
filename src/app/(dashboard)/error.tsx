"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="swiss-card industrial-screws rounded-lg p-8 max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2">
          <div className="led-indicator led-red" />
          <span className="font-mono text-[10px] font-bold text-danger uppercase tracking-widest">
            MODULE FAULT
          </span>
        </div>
        <div className="swiss-icon-well flex h-14 w-14 items-center justify-center text-danger">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-widest">
            Component Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            A dashboard module encountered an error. Your positions and funds are safe.
          </p>
        </div>
        <div className="w-full rounded-md border border-border-muted bg-surface-muted px-3 py-2">
          <p className="font-mono text-xs text-muted-foreground break-all">
            {error.message || "Unknown error"}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Link
            href="/dashboard"
            className="swiss-btn-outline flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            onClick={reset}
            className="swiss-btn-accent flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
