"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Loader2,
} from "lucide-react";

interface RecentWin {
  id: string;
  symbol: string;
  direction: string;
  leverage: number;
  pnlUsdc: number;
  pnlPct: number;
  sentimentScore: number;
  closedAt: string;
  trader: string;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function RecentWinsFeed() {
  const [wins, setWins] = useState<RecentWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWins = async () => {
      try {
        const res = await fetch("/api/dashboard/recent-wins");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setWins(data.wins ?? []);
      } catch {
        setWins([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWins();
  }, []);

  if (isLoading) {
    return (
      <div className="swiss-card rounded-lg industrial-screws p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-display uppercase tracking-widest">Recent Wins</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className="swiss-card rounded-lg industrial-screws p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-display uppercase tracking-widest">Recent Wins</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          No sentiment-aligned wins yet. Start trading to appear here!
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border-muted bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-display uppercase tracking-widest">Recent Wins</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Brain className="h-3.5 w-3.5" />
          <span>Sentiment-aligned</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {wins.map((win, idx) => {
          const isLong = win.direction === "long";

          return (
            <Link
              key={win.id}
              href={`/trade?symbol=${win.symbol}`}
              className="border border-border-muted bg-surface flex items-center justify-between gap-3 px-4 py-3 transition-all hover:shadow-neu-hover rounded-md card-entrance"
              style={{
                animationDelay: `calc(${idx} * var(--stagger-base))`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 border border-border-muted bg-surface ${isLong ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                >
                  {isLong ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{win.symbol}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {win.direction} {win.leverage}x
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {win.trader} · {timeAgo(win.closedAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-bold tabular-nums text-[var(--success)]">
                  +${win.pnlUsdc.toLocaleString()}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  +{win.pnlPct}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
