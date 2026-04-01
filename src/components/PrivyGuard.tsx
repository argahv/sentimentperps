"use client";

import { usePrivyConfigured } from "@/app/providers";

interface PrivyGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DEFAULT_FALLBACK = (
  <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
    Set NEXT_PUBLIC_PRIVY_APP_ID to enable wallet features.
  </div>
);

export function PrivyGuard({ children, fallback = DEFAULT_FALLBACK }: PrivyGuardProps) {
  const configured = usePrivyConfigured();
  if (!configured) return <>{fallback}</>;
  return <>{children}</>;
}
