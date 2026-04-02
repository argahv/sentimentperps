"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { BadgeList } from "@/components/ui/BadgeChip";
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
  Wallet,
  Shield,
  Hash,
  ArrowUpRight,
  RefreshCw,
  Star,
  Zap,
  Swords,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
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

interface ProfileStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  bestTrade: number;
  totalScore: number;
  avgResponseTime: number;
  sentimentAccuracy: number;
  rank: number | null;
  totalTraders: number;
}

interface DbTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  leverage: number;
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnlUsdc: number;
  pnlPct: number;
  sentimentAligned: boolean;
  score: number;
  closedAt: string;
}

function StatSkeleton() {
  return (
    <div className="border-2 border-border-muted bg-surface flex flex-col justify-center items-center gap-2 p-4 animate-pulse">
      <div className="h-10 w-10 bg-muted-foreground/15" />
      <div className="h-3 w-16 rounded bg-muted-foreground/15" />
      <div className="h-6 w-20 rounded bg-muted-foreground/15" />
    </div>
  );
}

function TradeRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 mx-1 mb-1 animate-pulse">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-4 w-20 rounded bg-muted-foreground/15" />
        <div className="h-3 w-32 rounded bg-muted-foreground/10" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-4 w-16 rounded bg-muted-foreground/15" />
        <div className="h-3 w-12 rounded bg-muted-foreground/10" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="swiss-card bg-surface p-5 animate-pulse flex flex-col gap-4">
      <div className="h-4 w-24 rounded bg-muted-foreground/15" />
      <div className="h-12 w-12 bg-muted-foreground/15 mx-auto" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border-muted bg-surface px-3 py-3">
            <div className="h-3 w-12 rounded bg-muted-foreground/10 mb-1.5" />
            <div className="h-4 w-8 rounded bg-muted-foreground/15" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileContent() {
  const { login, authenticated, ready: privyReady, user } = usePrivy();
  const { wallets } = useWallets();
  const { positions, closedPositions } = usePositionsStore();
  const [copied, setCopied] = useState(false);

  const [dbTrades, setDbTrades] = useState<DbTrade[]>([]);
  const [dbStats, setDbStats] = useState<ProfileStats | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [xpData, setXpData] = useState<{
    xp: number;
    level: number;
    levelName: string;
    xpForCurrent: number;
    xpForNext: number;
    progress: number;
  } | null>(null);
  const [quests, setQuests] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    xpReward: number;
    target: number;
    current: number;
    progress: number;
    completed: boolean;
  }[]>([]);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const walletProvider = wallet?.standardWallet?.name ?? "Unknown";
  const isEmbeddedWallet = walletProvider === "Privy";

  const fetchTrades = useCallback(async () => {
    if (!address) return;
    setTradesLoading(true);
    setTradesError(null);
    try {
      const res = await fetch(`/api/profile/trades?wallet=${address}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch trades");
      }
      const { trades } = await res.json();
      setDbTrades(trades ?? []);
    } catch (err) {
      setTradesError(err instanceof Error ? err.message : "Failed to fetch trades");
    } finally {
      setTradesLoading(false);
    }
  }, [address]);

  const fetchStats = useCallback(async () => {
    if (!address) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`/api/profile/stats?wallet=${address}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch stats");
      }
      const { stats } = await res.json();
      setDbStats(stats ?? null);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setStatsLoading(false);
    }
  }, [address]);

  const fetchBadges = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/profile/badges?wallet=${address}`);
      if (!res.ok) return;
      const { badges: data } = await res.json();
      setBadges(data.map((b: { badgeType: string }) => b.badgeType as BadgeType));
    } catch {}
  }, [address]);

  const fetchXp = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/profile/xp?wallet=${address}`);
      if (!res.ok) return;
      const data = await res.json();
      setXpData(data);
    } catch {}
  }, [address]);

  const fetchQuests = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/quests?wallet=${address}`);
      if (!res.ok) return;
      const { quests: data } = await res.json();
      setQuests(data);
    } catch {}
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchTrades();
      fetchStats();
      fetchBadges();
      fetchXp();
      fetchQuests();
    }
  }, [address, fetchTrades, fetchStats, fetchBadges, fetchXp, fetchQuests]);

  const livePositionTrades = useMemo(() => {
    return [...closedPositions, ...positions].map((p) => {
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
  }, [positions, closedPositions]);

  const displayTrades = useMemo(() => {
    if (dbTrades.length > 0) {
      return dbTrades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        leverage: t.leverage,
        size: t.size,
        won: t.pnlUsdc > 0,
        pnlUsdc: t.pnlUsdc,
        pnlPct: t.pnlPct,
        closedAt: typeof t.closedAt === "string" ? t.closedAt.split("T")[0] : t.closedAt,
      }));
    }
    if (livePositionTrades.length > 0) return livePositionTrades;
    return [];
  }, [dbTrades, livePositionTrades]);

  const localStats = useMemo(() => {
    if (displayTrades.length === 0) {
      return { totalTrades: 0, winRate: 0, totalPnl: 0, bestTrade: 0 };
    }
    const wins = displayTrades.filter((t) => t.pnlUsdc > 0).length;
    const totalPnl = displayTrades.reduce((sum, t) => sum + t.pnlUsdc, 0);
    const best = displayTrades.reduce((b, t) => (t.pnlUsdc > b ? t.pnlUsdc : b), -Infinity);
    return {
      totalTrades: displayTrades.length,
      winRate: displayTrades.length ? Math.round((wins / displayTrades.length) * 100) : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      bestTrade: best === -Infinity ? 0 : Math.round(best * 100) / 100,
    };
  }, [displayTrades]);

  const stats = dbStats
    ? {
        totalTrades: dbStats.totalTrades,
        winRate: dbStats.winRate,
        totalPnl: dbStats.totalPnl,
        bestTrade: dbStats.bestTrade,
      }
    : localStats;

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

  const hasData = displayTrades.length > 0 || (dbStats !== null && dbStats.totalTrades > 0);

  if (privyReady && !authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 page-enter">
        <div className="swiss-icon-well flex h-16 w-16 items-center justify-center text-primary">
          <User className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold uppercase tracking-widest">Connect to view your profile</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to see your trading stats, badges, and trade history.
        </p>
        <button
          onClick={login}
          className="swiss-btn-accent flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white"
        >
          <LogIn className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-4">
          <div className="swiss-icon-well flex h-14 w-14 items-center justify-center text-primary shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold truncate uppercase tracking-widest">
              {user?.email?.address ?? shortAddress ?? "Trader"}
            </h1>
            {address && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">{shortAddress}</span>
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
        {hasData && (
          <button
            onClick={() => {
              fetchTrades();
              fetchStats();
              fetchBadges();
              fetchXp();
              fetchQuests();
            }}
            className="swiss-btn-outline flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${tradesLoading || statsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {!hasData && !tradesLoading && !statsLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12 swiss-card bg-surface card-entrance">
              <BarChart3 className="h-10 w-10 text-muted-foreground opacity-50" />
              <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-widest">No trading history yet</h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
                Start trading to see your analytics, performance breakdown, and earn badges.
              </p>
              <Link
                href="/trade"
                className="swiss-btn-accent px-6 py-2.5 text-white font-semibold text-sm flex items-center gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Start Trading
              </Link>
            </div>
          ) : (
            <>
              {statsLoading && !dbStats ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <StatSkeleton key={i} />
                  ))}
                </div>
              ) : statsError ? (
                <div className="border border-border-muted bg-surface px-6 py-6 text-center flex flex-col items-center gap-2 card-entrance">
                  <Target className="h-6 w-6 text-danger" />
                  <p className="text-sm text-danger font-medium">Failed to load stats</p>
                  <p className="text-xs text-muted-foreground">{statsError}</p>
                  <button
                    onClick={fetchStats}
                    className="swiss-btn-accent px-4 py-1.5 text-xs font-semibold text-white mt-1"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div
                    className="border-2 border-border-muted bg-surface flex flex-col justify-center items-center gap-2 p-4 card-entrance"
                    style={{ animationDelay: "100ms" }}
                  >
                    <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-primary mb-1">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Total Trades
                    </p>
                    <p className="text-2xl font-bold font-display tabular-nums">
                      {totalTradesAnim.toFixed(0)}
                    </p>
                  </div>

                  <div
                    className="border-2 border-border-muted bg-surface flex flex-col justify-center items-center gap-2 p-4 card-entrance"
                    style={{ animationDelay: "150ms" }}
                  >
                    <WinRateDonut winRate={winRateAnim} size={64} />
                  </div>

                  <div
                    className="border-2 border-border-muted bg-surface flex flex-col justify-center items-center gap-2 p-4 card-entrance"
                    style={{ animationDelay: "200ms" }}
                  >
                    <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-amber-500 mb-1">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Total PnL
                    </p>
                    <p
                      className={`text-2xl font-bold font-display tabular-nums ${stats.totalPnl >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {stats.totalPnl >= 0 ? "+" : ""}${totalPnlAnim.toFixed(2)}
                    </p>
                  </div>

                  <div
                    className="border-2 border-border-muted bg-surface flex flex-col justify-center items-center gap-2 p-4 card-entrance"
                    style={{ animationDelay: "250ms" }}
                  >
                    <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-orange-500 mb-1">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Best Trade
                    </p>
                    <p className="text-2xl font-bold font-display tabular-nums text-success">
                      +${bestTradeAnim.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="swiss-card bg-surface overflow-hidden p-2 card-entrance"
                style={{ animationDelay: "300ms" }}
              >
                <div className="px-3 py-2 mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-widest">
                    <Target className="h-4 w-4 text-primary" />
                    Performance Breakdown
                  </h3>
                </div>
                {displayTrades.length > 0 ? (
                  <PerformanceBreakdown
                    trades={displayTrades.map((t) => ({
                      symbol: t.symbol,
                      pnl: t.pnlUsdc,
                      size: t.size,
                      won: t.won,
                    }))}
                  />
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No trade data available for breakdown.
                  </div>
                )}
              </div>

              <div
                className="swiss-card bg-surface overflow-hidden card-entrance"
                style={{ animationDelay: "350ms" }}
              >
                <div className="flex items-center gap-2 px-5 py-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest">Trade History</h3>
                  {displayTrades.length > 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground font-semibold tabular-nums">
                      {displayTrades.length} trades
                    </span>
                  )}
                </div>

                <div className="px-1">
                  {tradesLoading && dbTrades.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => <TradeRowSkeleton key={i} />)
                  ) : tradesError && dbTrades.length === 0 && displayTrades.length === 0 ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                      <p className="text-sm text-danger font-medium">Failed to load trades</p>
                      <p className="text-xs text-muted-foreground">{tradesError}</p>
                      <button
                        onClick={fetchTrades}
                        className="swiss-btn-accent px-4 py-1.5 text-xs font-semibold text-white mt-1"
                      >
                        Retry
                      </button>
                    </div>
                  ) : displayTrades.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No trades recorded yet.
                    </div>
                  ) : (
                    displayTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center gap-4 px-4 py-3 mx-1 mb-1 transition-colors hover:bg-surface-elevated"
                      >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-display">{trade.symbol}</span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-semibold ${
                                trade.direction === "long"
                                  ? "bg-success/15 text-success"
                                  : "bg-danger/15 text-danger"
                              }`}
                            >
                              {trade.direction === "long" ? "LONG" : "SHORT"} {trade.leverage}x
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            ${trade.entryPrice.toLocaleString()} &rarr; ${trade.exitPrice.toLocaleString()}
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
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {trade.closedAt}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-88px)] lg:overflow-y-auto card-entrance"
          style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
        >
          <div className="swiss-card bg-surface p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold font-display uppercase tracking-widest">Wallet</span>
            </div>

            {address ? (
              <div className="flex flex-col gap-2.5">
                <div className="border border-border-muted bg-surface px-3 py-2.5 flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Address
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-foreground truncate flex-1">
                      {address}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">Provider</span>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold truncate">{walletProvider}</span>
                    </div>
                  </div>
                  <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">Type</span>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold">
                        {isEmbeddedWallet ? "Embedded" : "External"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border-muted bg-surface px-4 py-4 text-center text-sm text-muted-foreground">
                No wallet connected
              </div>
            )}
          </div>

          {xpData && (
            <div className="swiss-card bg-surface p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold font-display uppercase tracking-widest">Level {xpData.level}</span>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {xpData.levelName}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>{xpData.xp.toLocaleString()} XP</span>
                  <span>{xpData.xpForNext.toLocaleString()} XP</span>
                </div>
                <div className="border border-border-muted bg-surface h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 bar-animate"
                    style={{ width: `${xpData.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {xpData.xpForNext - xpData.xp > 0
                    ? `${(xpData.xpForNext - xpData.xp).toLocaleString()} XP to next level`
                    : "Max level reached"}
                </p>
              </div>
            </div>
          )}

          {statsLoading && !dbStats ? (
            <SidebarSkeleton />
          ) : (
            <div className="swiss-card bg-surface p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold font-display uppercase tracking-widest">Your Rank</span>
              </div>

              {dbStats && dbStats.rank !== null ? (
                <>
                  <div className="flex items-center justify-center">
                    <div className="border border-border-muted bg-surface flex h-14 w-14 items-center justify-center text-xl font-bold text-primary">
                      #{dbStats.rank}
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground">
                    out of {dbStats.totalTraders} trader{dbStats.totalTraders !== 1 ? "s" : ""}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Score</span>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {dbStats.totalScore.toLocaleString()}
                      </span>
                    </div>
                    <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Accuracy</span>
                      <span className="text-sm font-bold tabular-nums">
                        {dbStats.sentimentAccuracy.toFixed(0)}%
                      </span>
                    </div>
                    <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Avg Speed</span>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {dbStats.avgResponseTime.toFixed(1)}m
                      </span>
                    </div>
                    <div className="border border-border-muted bg-surface px-3 py-2 flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Win Rate</span>
                      <span
                        className={`text-sm font-bold tabular-nums ${dbStats.winRate >= 60 ? "text-success" : "text-foreground"}`}
                      >
                        {dbStats.winRate}%
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/leaderboard"
                    className="swiss-btn-outline flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                    View Full Leaderboard
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <div className="border border-border-muted bg-surface px-4 py-6 text-center flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {statsLoading ? "Loading..." : "Not ranked yet — close a trade to get ranked!"}
                  </p>
                  <Link
                    href="/leaderboard"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Leaderboard →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="swiss-card bg-surface p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold font-display uppercase tracking-widest">Achievements</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-full tabular-nums">
                {badges.length}/{BADGE_TIERS.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {BADGE_TIERS.map((badge, idx) => {
                const isEarned = badges.includes(badge.type);
                return (
                  <div
                    key={badge.type}
                    className="flex flex-col items-center gap-1.5 card-entrance"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={`transition-all duration-300 ${!isEarned ? "opacity-30 grayscale" : "hover:scale-105"}`}
                    >
                      <BadgeList badges={[badge.type]} size="md" max={1} />
                    </div>
                    {!isEarned && (
                      <div className="w-full h-1 border border-border-muted bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40 rounded-full w-1/4 bar-animate" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {quests.length > 0 && (
            <div className="swiss-card bg-surface p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold font-display uppercase tracking-widest">Quests</span>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-full tabular-nums">
                  {quests.filter((q) => q.completed).length}/{quests.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`border border-border-muted bg-surface px-3 py-2.5 flex flex-col gap-1.5 ${quest.completed ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{quest.title}</span>
                      <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 shrink-0">
                        <Zap className="h-2.5 w-2.5" />
                        {quest.xpReward}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{quest.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border border-border-muted bg-surface h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bar-animate ${quest.completed ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                        {quest.current}/{quest.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
