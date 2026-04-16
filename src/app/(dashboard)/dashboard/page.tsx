"use client";

import dynamic from "next/dynamic";
import { PrivyGuard } from "@/components/PrivyGuard";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-40 bg-surface-elevated animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-surface-elevated animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-32 bg-surface-elevated animate-pulse rounded-md" />
      </div>
      {/* Signal cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-elevated animate-pulse rounded-lg" />
        ))}
      </div>
      {/* Hero stats */}
      <div className="h-32 bg-surface-elevated animate-pulse rounded-lg" />
      {/* Portfolio card */}
      <div className="h-56 bg-surface-elevated animate-pulse rounded-lg" />
      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-surface-elevated animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  return (
    <PrivyGuard fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </PrivyGuard>
  );
}
