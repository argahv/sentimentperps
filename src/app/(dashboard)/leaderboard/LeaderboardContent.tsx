"use client";

import { useLeaderboardStore, getDemoBadges } from "@/stores/leaderboard";
import { BadgeList } from "@/components/ui/BadgeChip";
import { Trophy, TrendingUp, Target, Flame } from "lucide-react";
import type { LeaderboardPeriod, LeaderboardEntry } from "@/types/app";

const PERIOD_TABS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "all-time", label: "All Time" },
];

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg font-bold text-amber-500">1</span>;
  if (rank === 2) return <span className="text-lg font-bold text-gray-500">2</span>;
  if (rank === 3) return <span className="text-lg font-bold text-orange-500">3</span>;
  return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const badges = getDemoBadges(entry.userId);
  const winRatePct = Math.round(entry.winRate * 100);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300 ${
        entry.rank <= 3
          ? "neu-extruded bg-background"
          : "neu-extruded-sm bg-background hover:shadow-neu-hover hover:translate-y-[-2px]"
      }`}
    >
      <div className="flex w-8 items-center justify-center shrink-0">
        <RankDisplay rank={entry.rank} />
      </div>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="neu-inset flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary shrink-0">
            {entry.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold truncate">{entry.username}</span>
        </div>
        {badges.length > 0 && <BadgeList badges={badges} max={3} />}
      </div>

      <div className="hidden sm:flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Win Rate</span>
          <span className={`text-sm font-semibold ${winRatePct >= 60 ? "text-success" : winRatePct >= 40 ? "text-foreground" : "text-danger"}`}>
            {winRatePct}%
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Trades</span>
          <span className="text-sm font-medium">{entry.totalTrades}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Best Call</span>
          <span className="text-sm font-semibold text-success">+${entry.bestCallPnl}</span>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 ml-2">
        <span className="text-[10px] text-muted-foreground">Score</span>
        <span className="text-base font-bold text-primary">{entry.totalScore.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function LeaderboardContent() {
  const { entries, period, setPeriod } = useLeaderboardStore();

  const topTrader = entries[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top sentiment traders ranked by signal timing and profitability.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-amber-500 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Top Trader</p>
            <p className="text-sm font-bold truncate">{topTrader?.username ?? "—"}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-success shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top Score</p>
            <p className="text-sm font-bold">{topTrader?.totalScore.toLocaleString() ?? "—"}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-primary shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Traders</p>
            <p className="text-sm font-bold">{entries.length}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-orange-500 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Call</p>
            <p className="text-sm font-bold text-success">+${topTrader?.bestCallPnl ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="neu-inset flex items-center gap-1 rounded-2xl p-1 self-start">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
              period === tab.value
                ? "neu-extruded-sm bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Trader</span>
          <span className="hidden sm:block w-16 text-right">Win %</span>
          <span className="hidden sm:block w-14 text-right">Trades</span>
          <span className="hidden sm:block w-20 text-right">Best Call</span>
          <span className="w-20 text-right ml-2">Score</span>
        </div>

        {entries.map((entry) => (
          <LeaderboardRow key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="neu-extruded-sm rounded-2xl bg-background p-4">
        <h3 className="text-xs font-semibold mb-2">Scoring Formula</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Score = profit_pct x (1 / minutes_after_signal). Trade faster after sentiment signals for higher scores. Profitable contrarian trades earn bonus multipliers.
        </p>
      </div>
    </div>
  );
}
