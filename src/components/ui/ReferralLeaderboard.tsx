"use client";

import { Trophy } from "lucide-react";

interface FuulLeaderboardEntry {
  address: string;
  affiliate_code?: string;
  total_amount: number;
  rank: number;
  total_attributions: number;
  referred_users?: number;
}

export function ReferralLeaderboard({
  currentUserAddress,
  entries,
}: {
  currentUserAddress: string | null;
  entries: FuulLeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return (
      <div className="swiss-card bg-surface p-6 rounded-lg industrial-screws flex flex-col gap-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-widest">Leaderboard</h3>
          <p className="text-sm text-muted-foreground mt-1">Top referrers this month.</p>
        </div>
        <div className="border border-border-muted bg-surface p-8 rounded-md flex flex-col items-center gap-3">
          <Trophy className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground text-center">
            No referral activity yet. Be the first to share!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="swiss-card bg-surface p-6 rounded-lg industrial-screws flex flex-col gap-6">
      <div>
        <h3 className="font-display text-lg font-bold uppercase tracking-widest">Leaderboard</h3>
        <p className="text-sm text-muted-foreground mt-1">Top referrers this month.</p>
      </div>

      <div className="flex flex-col border border-primary/10 rounded-md overflow-hidden">
        {entries.map((entry, idx) => {
          const isYou =
            currentUserAddress !== null &&
            entry.address.toLowerCase() === currentUserAddress.toLowerCase();
          const shortAddress = `${entry.address.slice(0, 4)}...${entry.address.slice(-4)}`;

          return (
            <div
              key={entry.address}
              className={`flex items-center justify-between p-4 card-entrance ${
                idx !== entries.length - 1 ? "border-b border-primary/5" : ""
              } ${isYou ? "border-l-[3px] border-l-primary bg-primary/5" : "bg-background/40"}`}
              style={{ animationDelay: `calc(${idx} * var(--stagger-base, 100ms))` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground tabular-nums w-4">
                  {entry.rank}
                </span>
                <div className="h-8 w-8 bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {entry.address.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{shortAddress}</span>
                    {isYou && (
                      <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 uppercase tracking-widest">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {entry.referred_users ?? entry.total_attributions} referrals
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-success tabular-nums">
                  {entry.total_amount.toLocaleString()} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
