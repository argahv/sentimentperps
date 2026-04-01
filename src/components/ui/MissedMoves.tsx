"use client";

import Link from "next/link";
import { useSentimentStore } from "@/stores/sentiment";
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

const MOCK_PRICE_MOVES: Record<string, { moved: number; direction: "up" | "down" }> = {
  BTC: { moved: 2.4, direction: "up" },
  ETH: { moved: 3.1, direction: "up" },
  SOL: { moved: -4.2, direction: "down" },
  DOGE: { moved: 8.7, direction: "up" },
  AVAX: { moved: -2.8, direction: "down" },
  ARB: { moved: 5.3, direction: "up" },
};

export function MissedMoves() {
  const { tokenCards } = useSentimentStore();

  const missedTokens = tokenCards
    .filter((t) => {
      const move = MOCK_PRICE_MOVES[t.symbol.toUpperCase()];
      if (!move) return false;
      if (t.sentiment === "positive" && move.direction === "up" && move.moved > 2) return true;
      if (t.sentiment === "negative" && move.direction === "down" && Math.abs(move.moved) > 2) return true;
      return false;
    })
    .slice(0, 4);

  if (missedTokens.length === 0) return null;

  return (
    <div className="neu-extruded flex flex-col gap-3 rounded-[32px] bg-warning/10 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold font-display text-warning">Missed Moves</h3>
        <span className="text-xs text-muted-foreground">
          Tokens that moved after a sentiment signal
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {missedTokens.map((token) => {
          const move = MOCK_PRICE_MOVES[token.symbol.toUpperCase()];
          if (!move) return null;
          const isUp = move.direction === "up";

          return (
            <Link
              key={token.symbol}
              href={`/trade?symbol=${token.symbol}`}
              className="neu-extruded-sm flex min-w-[180px] shrink-0 items-center justify-between gap-3 rounded-2xl bg-background px-3 py-2.5 transition-all hover:shadow-neu-hover hover:-translate-y-0.5"
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
                  className={`text-sm font-bold ${isUp ? "text-success" : "text-danger"}`}
                >
                  {isUp ? "+" : ""}
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
