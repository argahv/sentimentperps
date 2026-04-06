"use client";

import { useSentimentStore } from "@/stores/sentiment";
import { SentimentBadge } from "./SentimentBadge";
import { InfoTooltip } from "./InfoTooltip";
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
      <div className="flat-card rounded-lg bg-surface flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Sentiment</h3>
        <p className="text-xs text-muted-foreground">
          No sentiment data for {symbol}
        </p>
      </div>
    );
  }

  return (
    <div className="flat-card rounded-lg bg-surface industrial-screws flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flat-icon-well flex h-8 w-8 items-center justify-center rounded-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">Sentiment — {signal.symbol}</h3>
        </div>
        <SentimentBadge sentiment={signal.sentiment} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-elevated rounded-md flex flex-col items-center py-2 transition-all duration-200">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <span className="mt-1 text-lg font-semibold">
            {formatNumber(signal.mentionCount)}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Mentions</span>
            <InfoTooltip content="Total number of social media mentions for this token tracked by Elfa AI across Twitter, Reddit, and other platforms." size={12} />
          </div>
        </div>
        <div className="bg-surface-elevated rounded-md flex flex-col items-center py-2 transition-all duration-200">
          <Zap className="h-4 w-4 text-primary" />
          <span className="mt-1 text-lg font-semibold">
            {signal.velocity.toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">/min</span>
            <InfoTooltip content="Rate of new mentions per minute. A spike in velocity often precedes significant price moves." size={12} />
          </div>
        </div>
        <div className="bg-surface-elevated rounded-md flex flex-col items-center py-2 transition-all duration-200">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span
            className={`mt-1 text-lg font-semibold ${
              signal.mentionChange >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {signal.mentionChange >= 0 ? "+" : ""}
            {signal.mentionChange.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Change</span>
            <InfoTooltip content="Percentage change in mention volume compared to the previous period. Positive values indicate growing social interest." size={12} />
          </div>
        </div>
      </div>

      {signal.topMentions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Top Mentions
            </h4>
            <InfoTooltip content="Most influential recent social posts mentioning this token, ranked by author reach and engagement." size={12} />
          </div>
          {signal.topMentions.slice(0, 3).map((mention) => (
            <div
              key={mention.id}
              className="bg-surface-elevated rounded-md flex flex-col gap-1 px-3 py-2 transition-all duration-200 hover:brightness-110"
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
