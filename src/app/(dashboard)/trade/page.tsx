"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PrivyGuard } from "@/components/PrivyGuard";

const TradeContent = dynamic(() => import("./TradeContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-muted-foreground">
      Loading trade...
    </div>
  ),
});

export default function TradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <PrivyGuard>
        <TradeContent />
      </PrivyGuard>
    </Suspense>
  );
}
