"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="swiss-card industrial-screws rounded-lg p-8 max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="swiss-icon-well flex h-14 w-14 items-center justify-center text-danger">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold uppercase tracking-widest">
            System Error
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Something went wrong. This has been logged.
          </p>
        </div>
        <div className="w-full rounded-md border border-border-muted bg-surface-muted px-3 py-2">
          <p className="font-mono text-xs text-muted-foreground break-all">
            {error.message || "Unknown error"}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="swiss-btn-accent flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
