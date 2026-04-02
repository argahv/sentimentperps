"use client";

import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  address: string;
  fullAddress: string;
  referrals: number;
  earned: number;
}

export function ReferralLeaderboard({
  currentUserAddress,
  leaderboard,
}: {
  currentUserAddress: string | null;
  leaderboard: LeaderboardEntry[];
}) {
  if (leaderboard.length === 0) {
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
        {leaderboard.map((referrer, idx) => {
          const isYou =
            currentUserAddress !== null &&
            referrer.fullAddress.toLowerCase() === currentUserAddress.toLowerCase();
          const displayAddress = referrer.address;

          return (
            <div
              key={referrer.fullAddress}
              className={`flex items-center justify-between p-4 card-entrance ${
                idx !== leaderboard.length - 1 ? "border-b border-primary/5" : ""
              } ${isYou ? "border-l-[3px] border-l-primary bg-primary/5" : "bg-background/40"}`}
              style={{ animationDelay: `calc(${idx} * var(--stagger-base, 100ms))` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground tabular-nums w-4">
                  {idx + 1}
                </span>
                <div className="h-8 w-8 bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {displayAddress.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{displayAddress}</span>
                    {isYou && (
                      <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 uppercase tracking-widest">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {referrer.referrals} referrals
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-success tabular-nums">
                  ${referrer.earned.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
