"use client";

import dynamic from "next/dynamic";
import { PrivyGuard } from "@/components/PrivyGuard";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-muted-foreground">
      Loading dashboard...
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <PrivyGuard>
      <DashboardContent />
    </PrivyGuard>
  );
}
