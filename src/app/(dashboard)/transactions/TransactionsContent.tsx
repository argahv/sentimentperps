"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import {
  History,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Target,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Wallet,
  Clock,
} from "lucide-react";
import type {
  PacificaTradeFill,
  PacificaHistoricalOrder,
  PacificaPortfolioSnapshot,
} from "@/types/pacifica";

// ─── Tabs ──────────────────────────────────────────────────────────────────

type Tab = "fills" | "orders" | "funding";

const TABS: { key: Tab; label: string }[] = [
  { key: "fills", label: "Trade Fills" },
  { key: "orders", label: "Order History" },
  { key: "funding", label: "Funding History" },
];

const TIME_RANGES = ["1d", "7d", "14d", "30d", "all"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

// ─── Helpers ───────────────────────────────────────────────────────────────

function tsToDate(ts: number): Date {
  // Pacifica timestamps: if < 1e12 assume seconds, otherwise milliseconds
  return new Date(ts < 1e12 ? ts * 1000 : ts);
}

function fmtDate(ts: number): string {
  const d = tsToDate(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(ts: number): string {
  const d = tsToDate(ts);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtCrypto(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "0.0000";
  return n.toFixed(4);
}

function fmtPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function pnlColor(v: number): string {
  if (v > 0) return "text-success";
  if (v < 0) return "text-danger";
  return "text-muted-foreground";
}

function sideBadge(side: PacificaTradeFill["side"]): { label: string; cls: string } {
  switch (side) {
    case "open_long":
      return { label: "OPEN LONG", cls: "bg-success/15 text-success border-success/30" };
    case "close_long":
      return { label: "CLOSE LONG", cls: "bg-danger/15 text-danger border-danger/30" };
    case "open_short":
      return { label: "OPEN SHORT", cls: "bg-danger/15 text-danger border-danger/30" };
    case "close_short":
      return { label: "CLOSE SHORT", cls: "bg-success/15 text-success border-success/30" };
    default:
      return { label: String(side), cls: "bg-surface-muted text-muted-foreground border-border" };
  }
}

function orderSideBadge(side: "bid" | "ask"): { label: string; cls: string } {
  return side === "bid"
    ? { label: "BID", cls: "bg-success/15 text-success border-success/30" }
    : { label: "ASK", cls: "bg-danger/15 text-danger border-danger/30" };
}

function orderStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "filled":
      return { label: "FILLED", cls: "bg-success/15 text-success border-success/30" };
    case "cancelled":
      return { label: "CANCELLED", cls: "bg-warning/15 text-warning border-warning/30" };
    case "rejected":
      return { label: "REJECTED", cls: "bg-danger/15 text-danger border-danger/30" };
    case "open":
      return { label: "OPEN", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    case "partially_filled":
      return { label: "PARTIAL", cls: "bg-warning/15 text-warning border-warning/30" };
    default:
      return { label: status.toUpperCase(), cls: "bg-surface-muted text-muted-foreground border-border" };
  }
}

// ─── Skeleton Components ───────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="flat-card rounded-lg p-4">
      <div className="h-3 w-16 animate-pulse rounded bg-surface-muted mb-3" />
      <div className="h-7 w-24 animate-pulse rounded bg-surface-muted mb-1" />
      <div className="h-3 w-12 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}

// ─── Portfolio Chart (SVG) ─────────────────────────────────────────────────

function PortfolioChart({
  data,
  loading,
}: {
  data: PacificaPortfolioSnapshot[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flat-card rounded-lg p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-muted mb-4" />
        <div className="h-48 w-full animate-pulse rounded bg-surface-muted" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flat-card rounded-lg p-5 flex flex-col items-center justify-center h-48 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
        <span className="text-sm">No portfolio data available</span>
      </div>
    );
  }

  const W = 800;
  const H = 200;
  const PAD_X = 50;
  const PAD_Y = 20;

  const equities = data.map((d) => parseFloat(d.account_equity));
  const timestamps = data.map((d) => d.timestamp);
  const minEq = Math.min(...equities);
  const maxEq = Math.max(...equities);
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);

  const rangeEq = maxEq - minEq || 1;
  const rangeT = maxT - minT || 1;

  const points = data.map((d, i) => {
    const x = PAD_X + ((timestamps[i] - minT) / rangeT) * (W - PAD_X * 2);
    const y = PAD_Y + (1 - (equities[i] - minEq) / rangeEq) * (H - PAD_Y * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPoints = `${PAD_X},${H - PAD_Y} ${polyline} ${W - PAD_X},${H - PAD_Y}`;

  const latestEq = equities[equities.length - 1];
  const firstEq = equities[0];
  const change = latestEq - firstEq;
  const changePct = firstEq > 0 ? (change / firstEq) * 100 : 0;

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }).map((_, i) => {
    const val = minEq + (rangeEq * i) / 4;
    const y = PAD_Y + (1 - i / 4) * (H - PAD_Y * 2);
    return { val, y };
  });

  // X-axis labels (up to 5)
  const xTickCount = Math.min(5, data.length);
  const xTicks = Array.from({ length: xTickCount }).map((_, i) => {
    const idx = Math.floor((i / (xTickCount - 1 || 1)) * (data.length - 1));
    const t = timestamps[idx];
    const x = PAD_X + ((t - minT) / rangeT) * (W - PAD_X * 2);
    return { label: fmtDate(t), x };
  });

  return (
    <div className="flat-card industrial-screws rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flat-icon-well w-7 h-7">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Portfolio Equity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{fmtUsd(latestEq)}</span>
          <span className={`font-mono text-xs ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? "+" : ""}{fmtUsd(change)} ({changePct.toFixed(1)}%)
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-md bg-surface-muted/30 border border-border">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="eq-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4757" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF4757" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={PAD_X}
              y1={tick.y}
              x2={W - PAD_X}
              y2={tick.y}
              stroke="#2A3040"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
          ))}

          {/* Gradient fill */}
          <polygon points={fillPoints} fill="url(#eq-gradient)" />

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#FF4757"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Y-axis labels */}
          {yTicks.map((tick, i) => (
            <text
              key={i}
              x={PAD_X - 6}
              y={tick.y + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {fmtUsd(tick.val)}
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={H - 4}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Analytics Cards ───────────────────────────────────────────────────────

interface Analytics {
  totalPnl: number;
  winRate: number;
  totalVolume: number;
  feesPaid: number;
  totalTrades: number;
  winCount: number;
}

function computeAnalytics(fills: PacificaTradeFill[]): Analytics {
  const closeFills = fills.filter(
    (f) => f.side === "close_long" || f.side === "close_short",
  );

  let totalPnl = 0;
  let winCount = 0;
  let totalVolume = 0;
  let feesPaid = 0;

  for (const fill of fills) {
    const pnl = parseFloat(fill.pnl) || 0;
    const amount = parseFloat(fill.amount) || 0;
    const price = parseFloat(fill.price) || 0;
    const fee = Math.abs(parseFloat(fill.fee) || 0);

    totalVolume += amount * price;
    feesPaid += fee;
  }

  for (const fill of closeFills) {
    const pnl = parseFloat(fill.pnl) || 0;
    totalPnl += pnl;
    if (pnl > 0) winCount++;
  }

  return {
    totalPnl,
    winRate: closeFills.length > 0 ? (winCount / closeFills.length) * 100 : 0,
    totalVolume,
    feesPaid,
    totalTrades: closeFills.length,
    winCount,
  };
}

function AnalyticsCards({
  analytics,
  loading,
}: {
  analytics: Analytics | null;
  loading: boolean;
}) {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total P&L",
      value: `${analytics.totalPnl >= 0 ? "+" : ""}${fmtUsd(analytics.totalPnl)}`,
      color: analytics.totalPnl >= 0 ? "text-success" : "text-danger",
      icon: analytics.totalPnl >= 0 ? TrendingUp : TrendingDown,
      iconColor: analytics.totalPnl >= 0 ? "text-success" : "text-danger",
      sub: `${analytics.totalTrades} closed trades`,
    },
    {
      label: "Win Rate",
      value: `${analytics.winRate.toFixed(1)}%`,
      color:
        analytics.winRate >= 50
          ? "text-success"
          : analytics.winRate > 0
            ? "text-warning"
            : "text-muted-foreground",
      icon: Target,
      iconColor: "text-primary",
      sub: `${analytics.winCount}/${analytics.totalTrades} wins`,
    },
    {
      label: "Total Volume",
      value: fmtUsd(analytics.totalVolume),
      color: "text-foreground",
      icon: BarChart3,
      iconColor: "text-primary",
      sub: "cumulative",
    },
    {
      label: "Fees Paid",
      value: fmtUsd(analytics.feesPaid),
      color: "text-muted-foreground",
      icon: Receipt,
      iconColor: "text-warning",
      sub: "total fees",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flat-card rounded-lg p-4 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flat-icon-well w-6 h-6">
              <card.icon className={`h-3 w-3 ${card.iconColor}`} />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              {card.label}
            </span>
          </div>
          <span className={`font-mono text-xl font-bold ${card.color}`}>
            {card.value}
          </span>
          <span className="text-[10px] text-muted-foreground">{card.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function TransactionsContent() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = useMemo(
    () =>
      wallets.find((w) => w.standardWallet.name !== "Privy") ??
      wallets[0] ??
      null,
    [wallets],
  );
  const walletAddress = wallet?.address ?? null;

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("fills");

  // Trade fills state
  const [fills, setFills] = useState<PacificaTradeFill[]>([]);
  const [fillsCursor, setFillsCursor] = useState<string | null>(null);
  const [fillsHasMore, setFillsHasMore] = useState(false);
  const [fillsLoading, setFillsLoading] = useState(false);
  const [fillsError, setFillsError] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<PacificaHistoricalOrder[]>([]);
  const [ordersCursor, setOrdersCursor] = useState<string | null>(null);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PacificaPortfolioSnapshot[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Filter state
  const [symbolFilter, setSymbolFilter] = useState<string>("all");

  // ── Fetch trade fills ─────────────────────────────────────────────────

  const fetchFills = useCallback(
    async (cursor?: string) => {
      if (!walletAddress) return;
      setFillsLoading(true);
      setFillsError(null);
      try {
        const params = new URLSearchParams({
          account: walletAddress,
          limit: "50",
        });
        if (cursor) params.set("cursor", cursor);
        if (symbolFilter !== "all") params.set("symbol", symbolFilter);

        const res = await fetch(`/api/trades/history?${params}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error || `Failed to fetch trades: ${res.status}`,
          );
        }
        const json = await res.json();
        const newFills: PacificaTradeFill[] = json.data ?? [];

        setFills((prev) => (cursor ? [...prev, ...newFills] : newFills));
        setFillsCursor(json.next_cursor ?? null);
        setFillsHasMore(json.has_more ?? false);
      } catch (err) {
        setFillsError(
          err instanceof Error ? err.message : "Failed to fetch trade fills",
        );
      } finally {
        setFillsLoading(false);
      }
    },
    [walletAddress, symbolFilter],
  );

  // ── Fetch orders ──────────────────────────────────────────────────────

  const fetchOrders = useCallback(
    async (cursor?: string) => {
      if (!walletAddress) return;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const params = new URLSearchParams({
          account: walletAddress,
          limit: "50",
        });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/orders/history?${params}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error || `Failed to fetch orders: ${res.status}`,
          );
        }
        const json = await res.json();
        const newOrders: PacificaHistoricalOrder[] = json.data ?? [];

        setOrders((prev) => (cursor ? [...prev, ...newOrders] : newOrders));
        setOrdersCursor(json.next_cursor ?? null);
        setOrdersHasMore(json.has_more ?? false);
      } catch (err) {
        setOrdersError(
          err instanceof Error ? err.message : "Failed to fetch order history",
        );
      } finally {
        setOrdersLoading(false);
      }
    },
    [walletAddress],
  );

  // ── Fetch portfolio ───────────────────────────────────────────────────

  const fetchPortfolio = useCallback(
    async (range: TimeRange) => {
      if (!walletAddress) return;
      setPortfolioLoading(true);
      try {
        const res = await fetch(
          `/api/portfolio?account=${encodeURIComponent(walletAddress)}&time_range=${range}`,
        );
        if (!res.ok) throw new Error("Failed to fetch portfolio");
        const json = await res.json();
        setPortfolio(json.data ?? []);
      } catch {
        setPortfolio([]);
      } finally {
        setPortfolioLoading(false);
      }
    },
    [walletAddress],
  );

  // ── Initial data load ─────────────────────────────────────────────────

  useEffect(() => {
    if (!walletAddress) return;
    // Fetch fills, orders, and portfolio in parallel
    fetchFills();
    fetchOrders();
    fetchPortfolio(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Refetch fills when symbol filter changes
  useEffect(() => {
    if (!walletAddress) return;
    setFills([]);
    setFillsCursor(null);
    fetchFills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolFilter]);

  // Refetch portfolio when time range changes
  useEffect(() => {
    if (!walletAddress) return;
    fetchPortfolio(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // ── Derived data ──────────────────────────────────────────────────────

  const analytics = useMemo(
    () => (fills.length > 0 ? computeAnalytics(fills) : null),
    [fills],
  );

  const uniqueSymbols = useMemo(() => {
    const syms = new Set<string>();
    for (const f of fills) syms.add(f.symbol);
    return Array.from(syms).sort();
  }, [fills]);

  // ── Not authenticated state ───────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
        <div className="card-entrance" style={{ animationDelay: "0ms" }}>
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Full trade history, order log, and performance analytics.
            </p>
          </div>
        </div>
        <div
          className="card-entrance flat-card industrial-screws rounded-lg flex flex-col items-center justify-center py-20"
          style={{ animationDelay: "calc(1 * var(--stagger-base))" }}
        >
          <div className="flat-icon-well w-12 h-12 mb-4">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Connect your wallet to view transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between card-entrance"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-center gap-3">
          <div className="flat-icon-well w-9 h-9">
            <History className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Full trade history, order log, and performance analytics.
            </p>
          </div>
        </div>
      </div>

      {/* ── Analytics Cards ── */}
      <div
        className="card-entrance"
        style={{ animationDelay: "calc(1 * var(--stagger-base))" }}
      >
        <AnalyticsCards analytics={analytics} loading={fillsLoading && fills.length === 0} />
      </div>

      {/* ── Portfolio Chart ── */}
      <div
        className="card-entrance"
        style={{ animationDelay: "calc(1.5 * var(--stagger-base))" }}
      >
        <div className="flex flex-col gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1.5 justify-end">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
                  timeRange === range
                    ? "bg-primary text-white shadow-[var(--shadow-neu-inset)]"
                    : "text-muted-foreground shadow-[var(--shadow-neu-sm)] hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <PortfolioChart data={portfolio} loading={portfolioLoading} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="card-entrance"
        style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
      >
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-[var(--shadow-neu-inset)] shadow-[var(--shadow-neu-glow)]"
                  : "text-muted-foreground shadow-[var(--shadow-neu-sm)] hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      {activeTab === "fills" && (
        <div
          className="card-entrance flex items-center gap-3"
          style={{ animationDelay: "calc(2.3 * var(--stagger-base))" }}
        >
          <div className="relative">
            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="flat-input appearance-none pr-8 pl-3 py-2 text-xs font-mono rounded-md min-w-[140px]"
            >
              <option value="all">All Symbols</option>
              {uniqueSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* ── Tab Content ── */}
      <div
        className="card-entrance"
        style={{ animationDelay: "calc(2.5 * var(--stagger-base))" }}
      >
        {activeTab === "fills" && (
          <FillsTable
            fills={fills}
            loading={fillsLoading}
            error={fillsError}
            hasMore={fillsHasMore}
            onLoadMore={() => fillsCursor && fetchFills(fillsCursor)}
            onRetry={() => fetchFills()}
          />
        )}

        {activeTab === "orders" && (
          <OrdersTable
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            hasMore={ordersHasMore}
            onLoadMore={() => ordersCursor && fetchOrders(ordersCursor)}
            onRetry={() => fetchOrders()}
          />
        )}

        {activeTab === "funding" && <FundingPlaceholder />}
      </div>
    </div>
  );
}

// ─── Trade Fills Table ─────────────────────────────────────────────────────

function FillsTable({
  fills,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: {
  fills: PacificaTradeFill[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (error && fills.length === 0) {
    return (
      <ErrorBanner message={error} onRetry={onRetry} />
    );
  }

  return (
    <div className="flat-card industrial-screws rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50">
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Date
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Symbol
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Side
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Amount
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Price
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Entry
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fee
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                P&L
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cause
              </th>
            </tr>
          </thead>
          <tbody>
            {fills.map((fill) => {
              const badge = sideBadge(fill.side);
              const pnl = parseFloat(fill.pnl) || 0;
              return (
                <tr
                  key={fill.history_id}
                  className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors duration-150"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(fill.created_at)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-foreground">
                    {fill.symbol}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtCrypto(fill.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtPrice(fill.price)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtPrice(fill.entry_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {fmtPrice(fill.fee)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${pnlColor(pnl)}`}
                  >
                    {pnl > 0 ? "+" : ""}
                    {fmtUsd(pnl)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">
                    {fill.cause}
                  </td>
                </tr>
              );
            })}

            {/* Loading skeleton rows */}
            {loading &&
              fills.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={`skel-${i}`} cols={9} />
              ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {!loading && fills.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="h-8 w-8 mb-2 opacity-40" />
          <span className="text-sm">No trade history yet</span>
          <span className="text-xs mt-1 opacity-60">
            Your trade fills will appear here
          </span>
        </div>
      )}

      {/* Error banner (with existing data) */}
      {error && fills.length > 0 && (
        <ErrorBanner message={error} onRetry={onRetry} />
      )}

      {/* Load more / loading indicator */}
      {(hasMore || (loading && fills.length > 0)) && (
        <div className="flex justify-center py-4 border-t border-border/50">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="swiss-btn-outline flex items-center gap-2 px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Orders Table ──────────────────────────────────────────────────────────

function OrdersTable({
  orders,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: {
  orders: PacificaHistoricalOrder[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (error && orders.length === 0) {
    return <ErrorBanner message={error} onRetry={onRetry} />;
  }

  return (
    <div className="flat-card industrial-screws rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50">
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Date
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Symbol
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Side
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Type
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Price
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Avg Fill
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Amount
              </th>
              <th className="px-3 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Filled
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const sBadge = orderSideBadge(order.side);
              const stBadge = orderStatusBadge(order.order_status);
              return (
                <tr
                  key={order.order_id}
                  className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors duration-150"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(order.created_at)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-foreground">
                    {order.symbol}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${sBadge.cls}`}
                    >
                      {sBadge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">
                    {order.order_type}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtPrice(order.initial_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtPrice(order.average_filled_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtCrypto(order.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {fmtCrypto(order.filled_amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${stBadge.cls}`}
                    >
                      {stBadge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                    {order.reason ?? "—"}
                  </td>
                </tr>
              );
            })}

            {loading &&
              orders.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={`skel-${i}`} cols={10} />
              ))}
          </tbody>
        </table>
      </div>

      {!loading && orders.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="h-8 w-8 mb-2 opacity-40" />
          <span className="text-sm">No order history yet</span>
          <span className="text-xs mt-1 opacity-60">
            Your orders will appear here
          </span>
        </div>
      )}

      {error && orders.length > 0 && (
        <ErrorBanner message={error} onRetry={onRetry} />
      )}

      {(hasMore || (loading && orders.length > 0)) && (
        <div className="flex justify-center py-4 border-t border-border/50">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="swiss-btn-outline flex items-center gap-2 px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Funding Placeholder ───────────────────────────────────────────────────

function FundingPlaceholder() {
  return (
    <div className="flat-card industrial-screws rounded-lg flex flex-col items-center justify-center py-20">
      <span className="led-indicator led-yellow mb-4" />
      <p className="text-sm font-semibold text-foreground mb-1">
        Funding History
      </p>
      <p className="text-xs text-muted-foreground">
        Funding payment history coming soon
      </p>
    </div>
  );
}

// ─── Error Banner ──────────────────────────────────────────────────────────

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flat-card rounded-lg border-danger/30 bg-danger/5 p-4 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-danger">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="swiss-btn-outline px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest shrink-0"
      >
        Retry
      </button>
    </div>
  );
}
