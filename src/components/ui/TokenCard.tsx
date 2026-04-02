import Link from "next/link";
import { MessageCircle, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SentimentBadge } from "./SentimentBadge";
import type { TokenCardData } from "@/types/app";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function TokenCard({ token, intensity }: { token: TokenCardData; intensity?: number }) {
  const changePositive = token.mentionChange >= 0;
  const intensityValue = intensity ?? 0;
  const heatLabel = intensityValue > 0.7 ? "Hot" : intensityValue > 0.4 ? "Warm" : null;

  return (
    <Link
      href={`/trade?symbol=${token.symbol}`}
      className="swiss-card bg-surface group flex flex-col gap-3 p-4 transition-all active:scale-[0.98] hover:border-border-muted/80"
      style={{
        background: intensityValue > 0
          ? `linear-gradient(135deg, rgba(255,71,87,${intensityValue * 0.1}), transparent)`
          : undefined,
        borderLeft: intensityValue > 0.3
          ? `3px solid rgba(255,71,87,${intensityValue * 0.6})`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold font-display">{token.symbol}</span>
            {heatLabel && (
              <span className={`border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                heatLabel === "Hot" ? "border-primary/40 bg-primary/10 text-primary" : "border-warning/40 bg-warning/10 text-warning"
              }`}>
                {heatLabel}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{token.name}</span>
        </div>
        <SentimentBadge sentiment={token.sentiment} />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{formatNumber(token.mentionCount)}</span>
          <span
            className={`text-xs font-medium ${changePositive ? "text-success" : "text-danger"}`}
          >
            {changePositive ? (
              <ArrowUpRight className="inline h-3 w-3" />
            ) : (
              <ArrowDownRight className="inline h-3 w-3" />
            )}
            {formatChange(token.mentionChange)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs">{token.velocity.toFixed(2)}/min</span>
        </div>
      </div>

      {token.topMention && (
        <div className="border border-border-muted bg-surface px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            @{token.topMention.author}
          </span>{" "}
          {token.topMention.content.slice(0, 120)}
          {token.topMention.content.length > 120 ? "..." : ""}
        </div>
      )}
    </Link>
  );
}
