"use client";

import { useMemo } from "react";
import { usePriceData } from "@/hooks/usePriceData";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PriceTickerProps {
  symbols: string[];
}

function TickerItem({ symbol }: { symbol: string }) {
  const { currentPrice, priceChangePct } = usePriceData(symbol);
  const isPositive = priceChangePct >= 0;

  const formattedPrice = useMemo(() => {
    if (currentPrice >= 1000) return currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (currentPrice >= 1) return currentPrice.toFixed(2);
    return currentPrice.toFixed(4);
  }, [currentPrice]);

  return (
    <div className="border border-border-muted bg-surface flex items-center gap-2 px-3 py-2 rounded-md">
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
    </div>
  );
}

export function PriceTicker({ symbols }: PriceTickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {symbols.map((symbol) => (
        <TickerItem key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
