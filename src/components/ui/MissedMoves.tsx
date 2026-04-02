"use client";

import Link from "next/link";
import { useSentimentStore } from "@/stores/sentiment";
import { usePriceMoves } from "@/hooks/usePriceMoves";
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

export function MissedMoves() {
  const { tokenCards } = useSentimentStore();
  const { priceMoves, isLoading, error } = usePriceMoves();

  if (isLoading) {
    return (
      <div className="swiss-card border-warning/40 bg-warning-muted rounded-lg flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-bold font-display uppercase tracking-widest text-warning">
            Missed Moves
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-border-muted bg-surface min-w-[180px] rounded-md shrink-0 px-3 py-2.5 animate-pulse h-[60px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const missedTokens = tokenCards
    .filter((t) => {
      if (!t.symbol) return false;
      const move = priceMoves[t.symbol.toUpperCase()];
      if (!move) return false;
      if (
        t.sentiment === "positive" &&
        move.direction === "up" &&
        move.moved > 2
      )
        return true;
      if (
        t.sentiment === "negative" &&
        move.direction === "down" &&
        move.moved > 2
      )
        return true;
      return false;
    })
    .sort((a, b) => {
      const moveA = priceMoves[a.symbol?.toUpperCase() ?? ""];
      const moveB = priceMoves[b.symbol?.toUpperCase() ?? ""];
      return (moveB?.moved ?? 0) - (moveA?.moved ?? 0);
    })
    .slice(0, 4);

  if (missedTokens.length === 0) return null;

  return (
    <div className="swiss-card border-warning/40 bg-warning-muted rounded-lg industrial-screws flex flex-col gap-3 p-4 card-entrance">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-bold font-display uppercase tracking-widest text-warning">
          Missed Moves
        </h3>
        <span className="text-xs text-muted-foreground">
          Tokens that moved after a sentiment signal
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {missedTokens.map((token, idx) => {
          const move = token.symbol
            ? priceMoves[token.symbol.toUpperCase()]
            : undefined;
          if (!move) return null;
          const isUp = move.direction === "up";

          return (
            <Link
              key={token.symbol}
              href={`/trade?symbol=${token.symbol}`}
              className="border border-border-muted bg-surface flex min-w-[180px] shrink-0 items-center justify-between gap-3 px-3 py-2.5 transition-all hover:shadow-neu-hover rounded-md card-entrance"
              style={{
                animationDelay: `calc(${idx} * var(--stagger-base))`,
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{token.symbol}</span>
                <span className="text-[10px] text-muted-foreground">
                  {token.sentiment} signal
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isUp ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-danger" />
                )}
                <span
                  className={`text-sm font-bold tabular-nums ${isUp ? "text-success" : "text-danger"}`}
                >
                  {isUp ? "+" : "-"}
                  {move.moved.toFixed(1)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
