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

export function TokenCard({ token }: { token: TokenCardData }) {
  const changePositive = token.mentionChange >= 0;

  return (
    <Link
      href={`/trade?symbol=${token.symbol}`}
      className="neu-card group flex flex-col gap-3 rounded-[32px] bg-background p-4 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold font-display">{token.symbol}</span>
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
        <div className="neu-inset rounded-xl px-3 py-2 text-xs text-muted-foreground">
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
