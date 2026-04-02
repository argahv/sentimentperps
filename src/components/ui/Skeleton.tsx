"use client";

import { type ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`border border-border-muted animate-pulse bg-border-muted rounded-md ${className}`}
    />
  );
}

interface SkeletonTransitionProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export function SkeletonTransition({ loading, skeleton, children }: SkeletonTransitionProps) {
  if (loading) {
    return <div className="transition-opacity duration-200">{skeleton}</div>;
  }
  return <div className="skeleton-reveal">{children}</div>;
}

export function CardSkeleton() {
  return (
    <div className="swiss-card rounded-lg flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <Skeleton className="h-8 w-32 rounded-md" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="swiss-card rounded-lg overflow-hidden">
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
