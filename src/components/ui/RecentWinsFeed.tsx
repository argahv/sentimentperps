"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Loader2,
  Flame,
  Zap,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWins = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/dashboard/recent-wins");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setWins(data.wins ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWins();
  }, []);

  const displayWins = wins;
  

  if (isLoading && wins.length === 0) {
    return (
      <div className="flat-card rounded-lg industrial-screws p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border-muted relative">
          <div className="flat-icon-well h-10 w-10">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-foreground">
              Recent Wins
            </h2>
            <div className="h-3 w-40 bg-surface-muted rounded mt-2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-16 w-full neu-inset rounded-lg"></div>
          <div className="h-16 w-full neu-inset rounded-lg"></div>
          <div className="h-16 w-full neu-inset rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (displayWins.length === 0 && !isLoading) {
    return (
      <div className="flat-card rounded-lg industrial-screws p-6 text-center">
        <p className="text-muted-foreground font-mono text-sm">No sentiment-aligned wins yet. Start trading to appear here!</p>
      </div>
    );
  }

  return (
    <div className="flat-card rounded-lg industrial-screws p-6">
      {/* HEADER WITH SOCIAL PROOF */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-muted relative">
        <div className="flex items-center gap-4">
          <div className="flat-icon-well h-10 w-10">
            <Trophy className="h-5 w-5 text-[var(--color-primary)] drop-shadow-[0_0_8px_rgba(255,71,87,0.6)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-foreground">
              Recent Wins
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Proof that sentiment-driven trading works
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="industrial-vents opacity-50">
            <div className="industrial-vent-slot"></div>
            <div className="industrial-vent-slot"></div>
            <div className="industrial-vent-slot"></div>
          </div>
        </div>
      </div>

      {/* WINS LIST */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {displayWins.map((win, idx) => {
          const isLong = win.direction === "long";
          const pnlColor = win.pnlUsdc >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";
          const sign = win.pnlUsdc >= 0 ? "+" : "-";
          
          return (
            <Link
              key={win.id}
              href={`/trade?symbol=${win.symbol}`}
              className="group block p-3 rounded-lg border border-border-muted bg-surface hover:bg-surface-elevated hover:shadow-neu-hover transition-all card-entrance"
              style={{
                animationDelay: `calc(${idx} * var(--stagger-base, 50ms))`,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* LEFT: TRADE INFO */}
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  {/* DIRECTION BADGE */}
                  <div className={`flat-tag ${isLong ? 'flat-tag-success' : 'flat-tag-danger'} flex items-center gap-1 px-2 py-1 shrink-0`}>
                    {isLong ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{isLong ? 'LONG' : 'SHORT'}</span>
                  </div>
                  
                  {/* TRADE DETAILS */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold font-display text-foreground truncate">{win.symbol}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">
                        {win.leverage}x
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {win.trader} · {timeAgo(win.closedAt)}
                    </span>
                  </div>
                </div>

                {/* RIGHT: P&L AND SENTIMENT SCORE */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* ZAP FOR HIGH SENTIMENT */}
                    {win.sentimentScore > 85 && (
                      <span title={`${win.sentimentScore}% signal strength`}>
                        <Zap className="h-3.5 w-3.5 text-[var(--color-primary)] drop-shadow-[0_0_2px_rgba(255,71,87,0.8)]" />
                      </span>
                    )}
                    {/* FLAME FOR BIG WINS */}
                    {win.pnlPct > 20 && (
                      <span title={`+${win.pnlPct}% ROI`}>
                        <Flame className="h-3.5 w-3.5 text-[var(--color-warning)] drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]" />
                      </span>
                    )}
                    <span className={`text-base font-bold font-mono tabular-nums ${pnlColor}`}>
                      {sign}${Math.abs(win.pnlUsdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className={`${pnlColor} font-medium`}>
                      {win.pnlPct >= 0 ? '+' : ''}{win.pnlPct.toFixed(2)}%
                    </span>
                    
                    <div className="flex items-center gap-1.5" title={`Sentiment: ${win.sentimentScore}%`}>
                      <Brain className="h-3 w-3 opacity-70" />
                      <span>{win.sentimentScore}</span>
                      <div className="w-8 h-1.5 neu-inset-sm rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] shadow-[0_0_5px_rgba(255,71,87,0.5)]"
                          style={{ width: `${win.sentimentScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* FOOTER STATS */}
      {displayWins.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border-muted">
          <div className="neu-inset rounded-lg p-3 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Avg P&L</span>
              <span className="text-sm font-mono font-bold text-[var(--color-success)]">
                +${(displayWins.reduce((sum, w) => sum + w.pnlUsdc, 0) / displayWins.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l border-border-muted/30">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Win Rate</span>
              <span className="text-sm font-mono font-bold text-foreground">
                {((displayWins.filter(w => w.pnlUsdc > 0).length / displayWins.length) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}