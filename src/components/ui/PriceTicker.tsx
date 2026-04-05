"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePriceData } from "@/hooks/usePriceData";
import { useSentimentStore } from "@/stores/sentiment";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";

interface PriceTickerProps {
  symbols: string[];
}

function getSignal(score: number) {
  if (score >= 65) return { label: "BUY", color: "text-success", led: "led-green" } as const;
  if (score <= 35) return { label: "SELL", color: "text-primary", led: "led-red" } as const;
  return { label: "HOLD", color: "text-warning", led: "led-yellow" } as const;
}

function TickerItem({ symbol }: { symbol: string }) {
  const { currentPrice, priceChangePct } = usePriceData(symbol);
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const isPositive = priceChangePct >= 0;

  const formattedPrice = useMemo(() => {
    if (currentPrice >= 1000) return currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (currentPrice >= 1) return currentPrice.toFixed(2);
    return currentPrice.toFixed(4);
  }, [currentPrice]);

  const sentiment = useMemo(() => {
    const card = tokenCards.find(
      (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!card) return null;
    const score = card.sentimentScore;
    const confidence = Math.abs(score - 50) * 2;
    return { ...getSignal(score), confidence };
  }, [tokenCards, symbol]);

  return (
    <div className="border border-border-muted bg-surface flex items-center gap-2 px-3 py-2 rounded-md shrink-0">
      <span className="text-xs font-semibold">{symbol}</span>
      <span className="text-xs text-muted-foreground">${formattedPrice}</span>
      <span
        className={`flex items-center gap-0.5 text-[10px] font-medium ${
          isPositive ? "text-success" : "text-danger"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-2.5 w-2.5" />
        ) : (
          <ArrowDownRight className="h-2.5 w-2.5" />
        )}
        {isPositive ? "+" : ""}
        {priceChangePct.toFixed(2)}%
      </span>

      {sentiment && (
        <>
          <span className="w-px h-3.5 bg-border/50" />
          <span className={`${sentiment.led} shrink-0`} />
          <span className={`text-[10px] font-bold ${sentiment.color}`}>
            {sentiment.label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {sentiment.confidence.toFixed(0)}%
          </span>
          <Link
            href={`/trade?symbol=${symbol}`}
            className="ml-0.5 flex items-center justify-center rounded hover:bg-surface-elevated transition-colors"
            title={`Trade ${symbol}`}
          >
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </Link>
        </>
      )}
    </div>
  );
}

export function PriceTicker({ symbols }: PriceTickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {symbols.map((symbol) => (
        <TickerItem key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
