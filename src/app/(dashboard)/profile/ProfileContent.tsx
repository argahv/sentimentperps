"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { BadgeList } from "@/components/ui/BadgeChip";
import { getDemoBadges } from "@/stores/leaderboard";
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

interface DemoTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  leverage: number;
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
      pnlUsdc: Math.round(pnlUsdc * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      closedAt: `2026-03-${day.toString().padStart(2, "0")}`,
    };
  });
}

export default function ProfileContent() {
  const { login, authenticated, ready: privyReady, user } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const badges: BadgeType[] = address ? getDemoBadges(address) : ["first_mover", "streak_3", "speed_demon"];
  const trades = useMemo(() => generateDemoTrades(), []);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.pnlUsdc > 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnlUsdc, 0);
    const best = trades.reduce((best, t) => (t.pnlUsdc > best ? t.pnlUsdc : best), -Infinity);
    return {
      totalTrades: trades.length,
      winRate: trades.length ? Math.round((wins / trades.length) * 100) : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      bestTrade: Math.round(best * 100) / 100,
    };
  }, [trades]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (privyReady && !authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="neu-icon-well flex h-16 w-16 items-center justify-center rounded-2xl text-primary">
          <User className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold">Connect to view your profile</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to see your trading stats, badges, and trade history.
        </p>
        <button
          onClick={login}
          className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          <LogIn className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
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

      {badges.length > 0 && (
        <div className="neu-extruded rounded-[32px] bg-background p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3">Badges</h3>
          <BadgeList badges={badges} size="md" max={8} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-primary shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-lg font-bold">{stats.totalTrades}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-success shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold">{stats.winRate}%</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-amber-500 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total PnL</p>
            <p className={`text-lg font-bold ${stats.totalPnl >= 0 ? "text-success" : "text-danger"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl}
            </p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-orange-500 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Trade</p>
            <p className="text-lg font-bold text-success">+${stats.bestTrade}</p>
          </div>
        </div>
      </div>

      <div className="neu-extruded rounded-[32px] bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Trade History</h3>
        </div>
        <div className="px-1">
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center gap-4 px-4 py-3 mx-1 mb-1 rounded-xl transition-colors hover:bg-background/80">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{trade.symbol}</span>
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
                <span className="text-[10px] text-muted-foreground">
                  ${trade.entryPrice.toLocaleString()} -&gt; ${trade.exitPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    trade.pnlUsdc >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {trade.pnlUsdc >= 0 ? "+" : ""}${trade.pnlUsdc}
                </span>
                <span className="text-[10px] text-muted-foreground">{trade.closedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
