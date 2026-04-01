"use client";

import { useSentimentStore } from "@/stores/sentiment";
import { TokenCard } from "./TokenCard";
import { Flame, Clock, Loader2 } from "lucide-react";

export function HotTokensFeed() {
  const { tokenCards, isLoading, error, lastUpdated } = useSentimentStore();

  const hotTokens = [...tokenCards]
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 10);

  const risingTokens = [...tokenCards]
    .filter((t) => t.mentionChange > 50)
    .sort((a, b) => b.mentionChange - a.mentionChange)
    .slice(0, 5);

  if (error) {
    return (
      <div className="neu-extruded-sm rounded-2xl bg-danger/10 p-4 text-sm text-danger">
        Failed to load sentiment data: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Hot Tokens</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {hotTokens.length === 0 && !isLoading ? (
          <div className="neu-extruded-sm rounded-2xl bg-background p-8 text-center text-sm text-muted-foreground">
            No sentiment data available yet. Waiting for signals...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotTokens.map((token) => (
              <TokenCard key={token.symbol} token={token} />
            ))}
          </div>
        )}
      </div>

      {risingTokens.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-primary">
            FOMO Alert — Mentions Surging
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {risingTokens.map((token) => (
              <div key={token.symbol} className="min-w-[260px] shrink-0">
                <TokenCard token={token} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
