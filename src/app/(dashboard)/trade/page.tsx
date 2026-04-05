"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PrivyGuard } from "@/components/PrivyGuard";
import { TradePageSkeleton } from "@/components/ui/TradePageSkeleton";

const TradeContent = dynamic(() => import("./TradeContent"), {
  ssr: false,
  loading: () => <TradePageSkeleton />,
});

export default function TradePage() {
  return (
    <Suspense fallback={<TradePageSkeleton />}>
      <PrivyGuard>
        <TradeContent />
      </PrivyGuard>
    </Suspense>
  );
}
