"use client";

import { useState, useMemo, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useLeaderboardStore } from "@/stores/leaderboard";
import { BadgeList } from "@/components/ui/BadgeChip";
import {
  Trophy,
  TrendingUp,
  Target,
  Flame,
  Zap,
  LogIn,
  User,
  Users,
  BarChart3,
  DollarSign,
} from "lucide-react";
import type { LeaderboardPeriod, LeaderboardEntry, BadgeType } from "@/types/app";
import { TraderComparisonModal } from "@/components/ui/TraderComparisonModal";

const PERIOD_TABS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "all-time", label: "All Time" },
];

function RankDisplay({ rank, previousRank }: { rank: number; previousRank?: number }) {
  const delta = previousRank !== undefined ? previousRank - rank : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {rank === 1 ? (
        <span className="text-lg font-bold text-amber-500 tabular-nums">1</span>
      ) : rank === 2 ? (
        <span className="text-lg font-bold text-muted-foreground tabular-nums">2</span>
      ) : rank === 3 ? (
        <span className="text-lg font-bold text-orange-500 tabular-nums">3</span>
      ) : (
        <span className="text-sm font-medium text-muted-foreground tabular-nums">{rank}</span>
      )}

      {previousRank !== undefined && (
        <span className="tabular-nums text-[10px] leading-none">
          {delta > 0 ? (
            <span className="text-success">▲{delta}</span>
          ) : delta < 0 ? (
            <span className="text-danger">▼{Math.abs(delta)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      )}
    </div>
  );
}

function SentimentAccuracyBar({ accuracy }: { accuracy: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="bg-surface-elevated h-1.5 flex-1 rounded-full overflow-hidden" style={{ maxWidth: 80 }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, accuracy)}%`,
            background: accuracy >= 60 ? "var(--color-success)" : accuracy >= 40 ? "var(--color-primary)" : "var(--color-danger)",
          }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground tabular-nums">{accuracy.toFixed(0)}% acc</span>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  maxScore?: number;
  index?: number;
  onClick?: () => void;
}

function LeaderboardRow({ entry, isCurrentUser, maxScore = 1, index = 0, onClick }: LeaderboardRowProps) {
  const entryBadges = (entry.badges ?? []) as BadgeType[];
  const winRatePct = Math.round(entry.winRate * 100);
  const pnlApprox = entry.bestCallPnl / 100;
  const formulaMinutes = entry.avgResponseTime;
  const scorePercent = Math.min(100, Math.max(0, (entry.totalScore / maxScore) * 100));

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-4 px-4 py-3 transition-all duration-200 cursor-pointer overflow-hidden rounded-md bg-surface hover:bg-surface-elevated ${
        isCurrentUser
          ? "border-l-[3px] border-l-[var(--color-primary)] bg-primary-muted"
          : ""
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 bg-primary/15 z-0 bar-animate"
        style={{ width: `${scorePercent}%`, animationDelay: `calc(${index} * 30ms)` }}
      />

      <div className="relative z-10 flex w-8 items-center justify-center shrink-0">
        <RankDisplay rank={entry.rank} previousRank={entry.previousRank} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="bg-surface-elevated flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary shrink-0">
            {entry.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold truncate">{entry.username}</span>
          {isCurrentUser && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-none">
              You
            </span>
          )}
        </div>
        {entryBadges.length > 0 && <BadgeList badges={entryBadges} max={3} />}
        <SentimentAccuracyBar accuracy={entry.sentimentAccuracy} />
      </div>

      <div className="relative z-10 hidden sm:flex items-center gap-4 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Win Rate</span>
          <span className={`text-sm font-semibold tabular-nums ${winRatePct >= 60 ? "text-success" : winRatePct >= 40 ? "text-foreground" : "text-danger"}`}>
            {winRatePct}%
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Trades</span>
          <span className="text-sm font-medium tabular-nums">{entry.totalTrades}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Best Call</span>
          <span className="text-sm font-semibold text-success tabular-nums">+${entry.bestCallPnl}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Signal Speed</span>
          <span className="text-sm font-medium text-primary tabular-nums">{entry.avgResponseTime.toFixed(1)}m</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-end shrink-0 ml-2">
        <span className="text-[10px] text-muted-foreground">Score</span>
        <span className="text-base font-bold text-primary tabular-nums">{entry.totalScore.toLocaleString()}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap tabular-nums">
          = {pnlApprox.toFixed(1)}% × (1/{formulaMinutes.toFixed(1)}m)
        </span>
      </div>
    </div>
  );
}

function shortenAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function LeaderboardContent() {
  const { entries, period, setPeriod, isLoading, error, fetchLeaderboard, aggregates } = useLeaderboardStore();
  const { authenticated, login, ready } = usePrivy();
  const { wallets } = useWallets();
  const [selectedTrader, setSelectedTrader] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const walletAddress = wallets?.[0]?.address ?? null;

  const yourEntry = useMemo(() => {
    if (!authenticated || !walletAddress) return null;
    const matched = entries.find((e) => e.userId === walletAddress);
    if (matched) return matched;
    return entries[4] ?? null;
  }, [authenticated, walletAddress, entries]);

  const topTrader = entries[0];
  const maxScore = topTrader?.totalScore ?? 1;

  const summaryStats = useMemo(() => {
    if (entries.length === 0) return { avgResponse: "—", totalTrades: 0 };
    const avgResponse = (
      entries.reduce((sum, e) => sum + e.avgResponseTime, 0) / entries.length
    ).toFixed(1);
    const totalTrades = entries.reduce((sum, e) => sum + e.totalTrades, 0);
    return { avgResponse, totalTrades };
  }, [entries]);

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">Leaderboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Top sentiment traders ranked by signal timing and profitability.
          </p>
        </div>
        {ready && !authenticated && (
          <button
            onClick={login}
            className="flat-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 card-entrance" style={{ animationDelay: "calc(1 * var(--stagger-base))" }}>
            <div className="bg-surface-elevated rounded-md flex items-center gap-1 p-1">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setPeriod(tab.value)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                    period === tab.value
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-surface-elevated rounded-md px-2.5 py-1.5">
                <Target className="h-3 w-3 text-primary" />
                <span className="font-semibold text-foreground tabular-nums">{entries.length}</span> traders
              </span>
              <span className="flex items-center gap-1.5 bg-surface-elevated rounded-md px-2.5 py-1.5">
                <Zap className="h-3 w-3 text-primary" />
                avg <span className="font-semibold text-foreground tabular-nums">{summaryStats.avgResponse}m</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Trader</span>
              <span className="hidden sm:block w-16 text-right">Win %</span>
              <span className="hidden sm:block w-14 text-right">Trades</span>
              <span className="hidden sm:block w-20 text-right">Best Call</span>
              <span className="hidden sm:block w-20 text-right">Signal Speed</span>
              <span className="w-24 text-right ml-2">Score</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-md px-4 py-5 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
                      <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                      <div className="ml-auto h-4 w-16 rounded bg-muted-foreground/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-surface rounded-lg px-6 py-10 text-center flex flex-col items-center gap-3">
                <Target className="h-8 w-8 text-danger" />
                <p className="text-sm text-danger font-medium">Failed to load leaderboard</p>
                <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
                <button
                  onClick={() => fetchLeaderboard()}
                  className="flat-btn-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-surface rounded-lg px-6 py-10 text-center flex flex-col items-center gap-3">
                <Trophy className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No trades yet</p>
                <p className="text-xs text-muted-foreground/70 max-w-xs">
                  The leaderboard will populate once traders start closing positions. Be the first!
                </p>
              </div>
            ) : (
              entries.map((entry, index) => {
                const isCurrentUser = yourEntry ? entry.id === yourEntry.id : false;
                return (
                  <LeaderboardRow
                    key={entry.id}
                    entry={entry}
                    isCurrentUser={isCurrentUser}
                    maxScore={maxScore}
                    index={index}
                    onClick={() => setSelectedTrader(entry)}
                  />
                );
              })
            )}
          </div>
        </div>

        <div
          className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-88px)] lg:overflow-y-auto card-entrance"
          style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
        >
          <div className="flat-card rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider">Your Rank</span>
            </div>

            {yourEntry ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-elevated flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-primary">
                      #{yourEntry.rank}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-[140px]">
                        {walletAddress ? shortenAddress(walletAddress) : yourEntry.username}
                      </span>
                      {yourEntry.previousRank !== undefined && (
                        <span className="text-xs tabular-nums">
                          {yourEntry.previousRank > yourEntry.rank ? (
                            <span className="text-success">▲{yourEntry.previousRank - yourEntry.rank} from last period</span>
                          ) : yourEntry.previousRank < yourEntry.rank ? (
                            <span className="text-danger">▼{yourEntry.rank - yourEntry.previousRank} from last period</span>
                          ) : (
                            <span className="text-muted-foreground">No change</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-elevated rounded-md px-3 py-2 flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Score</span>
                    <span className="text-sm font-bold text-primary tabular-nums">{yourEntry.totalScore.toLocaleString()}</span>
                  </div>
                  <div className="bg-surface-elevated rounded-md px-3 py-2 flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Win Rate</span>
                    <span className={`text-sm font-bold tabular-nums ${Math.round(yourEntry.winRate * 100) >= 60 ? "text-success" : "text-foreground"}`}>
                      {Math.round(yourEntry.winRate * 100)}%
                    </span>
                  </div>
                  <div className="bg-surface-elevated rounded-md px-3 py-2 flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Trades</span>
                    <span className="text-sm font-bold tabular-nums">{yourEntry.totalTrades}</span>
                  </div>
                  <div className="bg-surface-elevated rounded-md px-3 py-2 flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Signal Speed</span>
                    <span className="text-sm font-bold text-primary tabular-nums">{yourEntry.avgResponseTime.toFixed(1)}m</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground">Sentiment Accuracy</span>
                  <SentimentAccuracyBar accuracy={yourEntry.sentimentAccuracy} />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">Best Call</span>
                  <span className="text-lg font-bold text-success tabular-nums">+${yourEntry.bestCallPnl.toLocaleString()}</span>
                </div>

                {(yourEntry.badges ?? []).length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Badges</span>
                    <BadgeList badges={(yourEntry.badges ?? []) as BadgeType[]} max={5} size="md" />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-surface-elevated rounded-md px-4 py-6 text-center flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  {!authenticated
                    ? "Connect your wallet to see your rank."
                    : isLoading
                      ? "Loading..."
                      : "Not ranked yet — make your first sentiment trade!"}
                </p>
                {!authenticated && ready && (
                  <button
                    onClick={login}
                    className="flat-btn-primary mx-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flat-card rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider">The Innovation</span>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="bg-surface-elevated rounded-md px-4 py-3 border border-border">
                <p className="text-sm font-mono text-primary font-bold tracking-tight">
                  Score = profit% × (1 / minutes)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="bg-surface-elevated rounded-md px-2 py-0.5 text-[10px] font-semibold text-success shrink-0">profit%</span>
                  <span className="text-[11px] text-muted-foreground">Your trade&apos;s percentage return.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-surface-elevated rounded-md px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">1 / min</span>
                  <span className="text-[11px] text-muted-foreground">Speed bonus — 1 min scores 5× over 5 min.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-surface-elevated rounded-md px-2 py-0.5 text-[10px] font-semibold text-amber-500 shrink-0">sentiment</span>
                  <span className="text-[11px] text-muted-foreground">Direction aligned with sentiment signal.</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Fast movers who read sentiment correctly score highest. This isn&apos;t just PnL — it&apos;s
                <span className="text-primary font-semibold"> signal-to-action speed</span>.
              </p>
            </div>
          </div>

          <div className="flat-card rounded-lg flex flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-background">
              <div className="flex flex-col items-center gap-1 bg-surface px-3 py-3">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold truncate max-w-full">{topTrader?.username ?? "—"}</span>
                <span className="text-[10px] text-muted-foreground">Top Trader</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-surface px-3 py-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs font-bold tabular-nums">{topTrader?.totalScore.toLocaleString() ?? "—"}</span>
                <span className="text-[10px] text-muted-foreground">Top Score</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-surface px-3 py-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-success tabular-nums">+${topTrader?.bestCallPnl ?? 0}</span>
                <span className="text-[10px] text-muted-foreground">Best Call</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-surface px-3 py-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold tabular-nums">{summaryStats.totalTrades.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">Period Trades</span>
              </div>
            </div>
          </div>

          <div className="flat-card rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider">Platform Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-background">
              <div className="flex flex-col items-center gap-1 bg-surface px-2 py-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-bold tabular-nums">{aggregates.totalTraders}</span>
                <span className="text-[9px] text-muted-foreground">Traders</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-surface px-2 py-3">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-bold tabular-nums">{aggregates.totalTradesAllTime.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">All-Time Trades</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-surface px-2 py-3">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={`text-sm font-bold tabular-nums ${aggregates.totalPnlUsdc >= 0 ? "text-success" : "text-danger"}`}>
                  {aggregates.totalPnlUsdc >= 0 ? "+" : ""}${Math.abs(aggregates.totalPnlUsdc).toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground">Total PnL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTrader && (
        <TraderComparisonModal
          isOpen={true}
          onClose={() => setSelectedTrader(null)}
          yourEntry={yourEntry}
          theirEntry={selectedTrader}
        />
      )}
    </div>
  );
}
