import { X } from "lucide-react";
import type { LeaderboardEntry } from "@/types/app";

export interface TraderComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  yourEntry: LeaderboardEntry | null;
  theirEntry: LeaderboardEntry;
}

export function TraderComparisonModal({
  isOpen,
  onClose,
  yourEntry,
  theirEntry,
}: TraderComparisonModalProps) {
  if (!isOpen) return null;

  const stats = [
    {
      label: "Total Score",
      getValue: (e: LeaderboardEntry) => Math.round(e.totalScore),
      format: (val: number) => val.toLocaleString(),
      higherIsBetter: true,
    },
    {
      label: "Win Rate",
      getValue: (e: LeaderboardEntry) => Math.round(e.winRate * 100),
      format: (val: number) => `${val}%`,
      higherIsBetter: true,
    },
    {
      label: "Total Trades",
      getValue: (e: LeaderboardEntry) => e.totalTrades,
      format: (val: number) => val.toLocaleString(),
      higherIsBetter: true,
    },
    {
      label: "Best Call",
      getValue: (e: LeaderboardEntry) => e.bestCallPnl,
      format: (val: number) => `$${val.toLocaleString()}`,
      higherIsBetter: true,
    },
    {
      label: "Sentiment Accuracy",
      getValue: (e: LeaderboardEntry) => e.sentimentAccuracy,
      format: (val: number) => `${val}%`,
      higherIsBetter: true,
    },
    {
      label: "Signal Speed",
      getValue: (e: LeaderboardEntry) => e.avgResponseTime,
      format: (val: number) => `${val}m`,
      higherIsBetter: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="swiss-card bg-surface rounded-lg industrial-screws card-entrance relative w-full max-w-md p-6 m-4">
        <button
          onClick={onClose}
          className="swiss-btn-outline absolute right-4 top-4 rounded-full p-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-center text-xl font-display font-bold text-foreground uppercase tracking-widest">
          Trader Comparison
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6 text-sm font-semibold text-muted-foreground border-b border-border-muted pb-2">
          <div className="text-center truncate">You</div>
          <div className="text-center">Metric</div>
          <div className="text-center truncate">{theirEntry.username}</div>
        </div>

        <div className="space-y-4">
          {stats.map((stat, idx) => {
            const theirVal = stat.getValue(theirEntry);
            let youHighlight = false;
            let theirHighlight = false;
            let yourVal: number | null = null;

            if (yourEntry) {
              yourVal = stat.getValue(yourEntry);
              if (yourVal !== theirVal) {
                if (stat.higherIsBetter) {
                  youHighlight = yourVal > theirVal;
                  theirHighlight = theirVal > yourVal;
                } else {
                  youHighlight = yourVal < theirVal;
                  theirHighlight = theirVal < yourVal;
                }
              }
            }

            return (
              <div key={idx} className="grid grid-cols-3 items-center gap-4">
                <div
                  className={`text-center tabular-nums ${
                    youHighlight ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {yourEntry && yourVal !== null ? (
                    stat.format(yourVal)
                  ) : idx === 0 ? (
                    <span className="text-xs text-muted-foreground">Connect wallet</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                <div className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
                <div
                  className={`text-center tabular-nums ${
                    theirHighlight ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {stat.format(theirVal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
