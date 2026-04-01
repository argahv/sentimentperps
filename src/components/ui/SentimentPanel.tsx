"use client";

import { useSentimentStore } from "@/stores/sentiment";
import { SentimentBadge } from "./SentimentBadge";
import {
  MessageCircle,
  Zap,
  Users,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function SentimentPanel({ symbol }: { symbol: string }) {
  const signal = useSentimentStore((s) => s.getSignalBySymbol(symbol));

  if (!signal) {
    return (
      <div className="neu-extruded flex flex-col gap-3 rounded-[32px] bg-background p-4">
        <h3 className="text-sm font-semibold font-display">Sentiment</h3>
        <p className="text-xs text-muted-foreground">
          No sentiment data for {symbol}
        </p>
      </div>
    );
  }

  return (
    <div className="neu-extruded flex flex-col gap-4 rounded-[32px] bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="neu-icon-well flex h-8 w-8 items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold font-display">Sentiment — {signal.symbol}</h3>
        </div>
        <SentimentBadge sentiment={signal.sentiment} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="neu-inset flex flex-col items-center rounded-xl py-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <span className="mt-1 text-lg font-semibold">
            {formatNumber(signal.mentionCount)}
          </span>
          <span className="text-[10px] text-muted-foreground">Mentions</span>
        </div>
        <div className="neu-inset flex flex-col items-center rounded-xl py-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="mt-1 text-lg font-semibold">
            {signal.velocity.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground">/min</span>
        </div>
        <div className="neu-inset flex flex-col items-center rounded-xl py-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span
            className={`mt-1 text-lg font-semibold ${
              signal.mentionChange >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {signal.mentionChange >= 0 ? "+" : ""}
            {signal.mentionChange.toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground">Change</span>
        </div>
      </div>

      {signal.topMentions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Top Mentions
          </h4>
          {signal.topMentions.slice(0, 3).map((mention) => (
            <div
              key={mention.id}
              className="neu-inset flex flex-col gap-1 rounded-xl px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  @{mention.author.username}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>
                    {formatNumber(mention.author.followers_count)} followers
                  </span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mention.content.slice(0, 200)}
                {mention.content.length > 200 ? "..." : ""}
              </p>
              {mention.sentiment && (
                <SentimentBadge sentiment={mention.sentiment} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
