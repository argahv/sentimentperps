"use client";

import { useMemo } from "react";

const DEMO_REFERRERS = [
  { address: "8xPq...dF4k", referrals: 28, earned: 342.50 },
  { address: "3jRm...xP2s", referrals: 22, earned: 268.30 },
  { address: "9kLn...wQ7r", referrals: 18, earned: 215.60 },
  { address: "5vMx...bR9t", referrals: 12, earned: 156.42 },
  { address: "7wNz...cS1u", referrals: 8, earned: 89.20 },
];

export function ReferralLeaderboard({
  currentUserAddress,
}: {
  currentUserAddress: string | null;
}) {
  const leaderBoard = useMemo(() => {
    if (!currentUserAddress) return DEMO_REFERRERS;
    return DEMO_REFERRERS.map((ref, idx) => {
      if (idx === 3) {
        return { ...ref, address: currentUserAddress, isYou: true };
      }
      return ref;
    });
  }, [currentUserAddress]);

  return (
    <div className="neu-card-enhanced glass-panel p-6 rounded-[32px] flex flex-col gap-6">
      <div>
        <h3 className="font-display text-lg font-bold">Leaderboard</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Top referrers this month.
        </p>
      </div>

      <div className="flex flex-col border border-primary/10 rounded-2xl overflow-hidden">
        {leaderBoard.map((referrer, idx) => {
          const isYou = "isYou" in referrer && referrer.isYou;
          const displayAddress = isYou 
            ? `${referrer.address.slice(0, 4)}...${referrer.address.slice(-4)}`
            : referrer.address;
            
          return (
            <div
              key={referrer.address + idx}
              className={`flex items-center justify-between p-4 card-entrance ${
                idx !== leaderBoard.length - 1 ? "border-b border-primary/5" : ""
              } ${
                isYou
                  ? "border-l-[3px] border-l-primary bg-primary/5"
                  : "bg-background/40"
              }`}
              style={{ animationDelay: `calc(${idx} * var(--stagger-base, 100ms))` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground tabular-nums w-4">
                  {idx + 1}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {displayAddress.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {displayAddress}
                    </span>
                    {Boolean(isYou) && (
                      <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
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
