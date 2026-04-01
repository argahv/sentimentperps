"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { BadgeList } from "@/components/ui/BadgeChip";
import { getDemoBadges } from "@/stores/leaderboard";
import { usePositionsStore } from "@/stores/positions";
import { WinRateDonut } from "@/components/ui/WinRateDonut";
import { PerformanceBreakdown } from "@/components/ui/PerformanceBreakdown";
import { useCountUp } from "@/hooks/useCountUp";
import Link from "next/link";
import {
  User,
  Copy,
  Check,
  TrendingUp,
  Target,
  Trophy,
  BarChart3,
  Clock,
  LogIn,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { BadgeType } from "@/types/app";

const BADGE_TIERS = [
  { type: "first_mover" as BadgeType, label: "First Mover", threshold: 1, metric: "trades" },
  { type: "streak_3" as BadgeType, label: "3 Win Streak", threshold: 3, metric: "streak" },
  { type: "streak_5" as BadgeType, label: "5 Win Streak", threshold: 5, metric: "streak" },
  { type: "streak_10" as BadgeType, label: "10 Win Streak", threshold: 10, metric: "streak" },
  { type: "whale_hunter" as BadgeType, label: "Whale Hunter", threshold: 1000, metric: "bestPnl" },
  { type: "sentiment_guru" as BadgeType, label: "Sentiment Guru", threshold: 80, metric: "winRate" },
  { type: "speed_demon" as BadgeType, label: "Speed Demon", threshold: 1, metric: "speed" },
  { type: "contrarian" as BadgeType, label: "Contrarian", threshold: 1, metric: "contrarian" },
];

interface DemoTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  size: number;
  won: boolean;
  pnlUsdc: number;
  pnlPct: number;
  closedAt: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDemoTrades(): DemoTrade[] {
  const rng = seededRandom(314159);
  const symbols = ["BTC", "ETH", "SOL", "ARB", "DOGE"];

  return Array.from({ length: 8 }, (_, i) => {
    const symbol = symbols[Math.floor(rng() * symbols.length)];
    const direction = rng() > 0.5 ? ("long" as const) : ("short" as const);
    const leverage = [2, 5, 10, 20][Math.floor(rng() * 4)];
    const entryPrice = symbol === "BTC" ? 60000 + rng() * 10000 : symbol === "ETH" ? 3000 + rng() * 500 : 50 + rng() * 150;
    const pnlPct = (rng() - 0.4) * 40;
    const pnlUsdc = Math.round(pnlPct * (10 + rng() * 50)) / 100;
    const exitPrice = direction === "long"
      ? entryPrice * (1 + pnlPct / 100 / leverage)
      : entryPrice * (1 - pnlPct / 100 / leverage);

    const day = 28 - i;
    return {
      id: `trade-${i}`,
      symbol,
      direction,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      leverage,
      size: Math.round(entryPrice * leverage * 0.01 * 100) / 100,
      won: pnlUsdc > 0,
      pnlUsdc: Math.round(pnlUsdc * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      closedAt: `2026-03-${day.toString().padStart(2, "0")}`,
    };
  });
}

export default function ProfileContent() {
  const { login, authenticated, ready: privyReady, user } = usePrivy();
  const { wallets } = useWallets();
  const { positions, closedPositions } = usePositionsStore();
  const [copied, setCopied] = useState(false);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const earnedBadges: BadgeType[] = address ? getDemoBadges(address) : ["first_mover", "streak_3", "speed_demon"];
  
  const trades = useMemo(() => {
    const hasRealPositions = positions.length > 0 || closedPositions.length > 0;
    if (hasRealPositions) {
      return [...closedPositions, ...positions].map(p => {
        const pnl = p.realized_pnl + p.unrealized_pnl;
        return {
          id: p.position_id,
          symbol: p.symbol,
          direction: p.side as "long" | "short",
          entryPrice: p.entry_price,
          exitPrice: p.mark_price,
          leverage: p.leverage,
          size: p.size,
          won: pnl > 0,
          pnlUsdc: pnl,
          pnlPct: p.margin > 0 ? (pnl / p.margin) * 100 : 0,
          closedAt: p.updated_at,
        };
      });
    }
    return generateDemoTrades();
  }, [positions, closedPositions]);

  const hasAnyPositions = positions.length > 0 || closedPositions.length > 0;

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.pnlUsdc > 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnlUsdc, 0);
    const best = trades.reduce((best, t) => (t.pnlUsdc > best ? t.pnlUsdc : best), -Infinity);
    return {
      totalTrades: trades.length,
      winRate: trades.length ? Math.round((wins / trades.length) * 100) : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      bestTrade: best === -Infinity ? 0 : Math.round(best * 100) / 100,
    };
  }, [trades]);

  const totalTradesAnim = useCountUp(stats.totalTrades, 1200);
  const winRateAnim = useCountUp(stats.winRate, 1200);
  const totalPnlAnim = useCountUp(stats.totalPnl, 1200);
  const bestTradeAnim = useCountUp(stats.bestTrade, 1200);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (privyReady && !authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 page-enter">
        <div className="neu-icon-well flex h-16 w-16 items-center justify-center rounded-2xl text-primary">
          <User className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold">Connect to view your profile</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to see your trading stats, badges, and trade history.
        </p>
        <button
          onClick={login}
          className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white btn-bounce"
        >
          <LogIn className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 page-enter">
      <div className="flex items-center gap-4">
        <div className="neu-icon-well flex h-14 w-14 items-center justify-center rounded-2xl text-primary shrink-0">
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold truncate">
            {user?.email?.address ?? shortAddress ?? "Trader"}
          </h1>
          {address && (
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-mono">{shortAddress}</span>
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      <div className="neu-extruded rounded-[32px] bg-background p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Achievements
          </h3>
          <span className="text-xs font-semibold text-muted-foreground bg-muted/30 px-2 py-1 rounded-full tabular-nums">
            {earnedBadges.length} / {BADGE_TIERS.length} unlocked
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGE_TIERS.map((badge, idx) => {
            const isEarned = earnedBadges.includes(badge.type);
            return (
              <div key={badge.type} className="flex flex-col gap-2 card-entrance" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className={`transition-all duration-300 ${!isEarned ? "opacity-30 grayscale" : "hover:scale-105"}`}>
                  <BadgeList badges={[badge.type]} size="md" max={1} />
                </div>
                {!isEarned && (
                  <div className="w-full h-1.5 neu-inset rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-primary/40 rounded-full w-1/4 bar-animate" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!hasAnyPositions ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12 neu-card-enhanced rounded-[32px] card-entrance">
          <BarChart3 className="h-10 w-10 text-muted-foreground opacity-50" />
          <h2 className="font-display text-lg font-semibold text-foreground">No trading history yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
            Start trading to see your analytics, performance breakdown, and earn badges.
          </p>
          <Link href="/trade" className="neu-btn px-6 py-2.5 bg-primary text-white rounded-2xl font-semibold text-sm btn-bounce">
            Start Trading
          </Link>
          
          <div className="mt-8 w-full opacity-60 pointer-events-none">
            <div className="text-xs font-semibold text-muted-foreground text-center mb-4 uppercase tracking-wider">
              Example Data
            </div>
            <PerformanceBreakdown trades={trades.map(t => ({ symbol: t.symbol, pnl: t.pnlUsdc, size: t.size, won: t.won }))} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="neu-extruded-sm flex flex-col justify-center items-center gap-2 rounded-2xl bg-background p-4 card-entrance" style={{ animationDelay: "100ms" }}>
              <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-primary mb-1">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Trades</p>
              <p className="text-2xl font-bold font-display tabular-nums">{totalTradesAnim.toFixed(0)}</p>
            </div>
            
            <div className="neu-extruded-sm flex flex-col justify-center items-center gap-2 rounded-2xl bg-background p-4 card-entrance" style={{ animationDelay: "150ms" }}>
              <WinRateDonut winRate={winRateAnim} size={64} />
            </div>

            <div className="neu-extruded-sm flex flex-col justify-center items-center gap-2 rounded-2xl bg-background p-4 card-entrance" style={{ animationDelay: "200ms" }}>
              <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-amber-500 mb-1">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total PnL</p>
              <p className={`text-2xl font-bold font-display tabular-nums ${stats.totalPnl >= 0 ? "text-success" : "text-danger"}`}>
                {stats.totalPnl >= 0 ? "+" : ""}${totalPnlAnim.toFixed(2)}
              </p>
            </div>

            <div className="neu-extruded-sm flex flex-col justify-center items-center gap-2 rounded-2xl bg-background p-4 card-entrance" style={{ animationDelay: "250ms" }}>
              <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-orange-500 mb-1">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Best Trade</p>
              <p className="text-2xl font-bold font-display tabular-nums text-success">
                +${bestTradeAnim.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="neu-extruded rounded-[32px] bg-background overflow-hidden p-2 card-entrance" style={{ animationDelay: "300ms" }}>
            <div className="px-3 py-2 mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Performance Breakdown
              </h3>
            </div>
            <PerformanceBreakdown trades={trades.map(t => ({ symbol: t.symbol, pnl: t.pnlUsdc, size: t.size, won: t.won }))} />
          </div>
        </>
      )}

      <div className="neu-extruded rounded-[32px] bg-background overflow-hidden card-entrance" style={{ animationDelay: "350ms" }}>
        <div className="flex items-center gap-2 px-5 py-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Trade History</h3>
        </div>
        <div className="px-1">
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center gap-4 px-4 py-3 mx-1 mb-1 rounded-xl transition-colors hover:bg-background/80">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold font-display">{trade.symbol}</span>
                  <span
                    className={`rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${
                      trade.direction === "long"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {trade.direction === "long" ? "LONG" : "SHORT"} {trade.leverage}x
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  ${trade.entryPrice.toLocaleString()} -&gt; ${trade.exitPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    trade.pnlUsdc >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {trade.pnlUsdc >= 0 ? "+" : ""}${trade.pnlUsdc.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{trade.closedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
