"use client";

import Link from "next/link";
import { Zap, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { useSentimentStore } from "@/stores/sentiment";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import type { TokenCardData } from "@/types/app";

interface DivergenceItem {
  token: TokenCardData;
  divergenceStrength: number;
  signalType: "contrarian-long" | "contrarian-short";
}

function computeDivergences(tokenCards: TokenCardData[]): DivergenceItem[] {
  return tokenCards
    .filter((t) => {
      const bullishDivergence = t.sentiment === "positive" && t.priceChange24h < 0;
      const bearishDivergence = t.sentiment === "negative" && t.priceChange24h > 0;
      return bullishDivergence || bearishDivergence;
    })
    .map((t) => ({
      token: t,
      divergenceStrength:
        Math.round((Math.abs(t.sentimentScore - 50) * Math.abs(t.priceChange24h)) / 10 * 10) / 10,
      signalType: (
        t.sentiment === "positive" && t.priceChange24h < 0
          ? "contrarian-short"
          : "contrarian-long"
      ) as "contrarian-long" | "contrarian-short",
    }))
    .sort((a, b) => b.divergenceStrength - a.divergenceStrength);
}

function DivergenceCard({ item, index }: { item: DivergenceItem; index: number }) {
  const { token, divergenceStrength, signalType } = item;
  const isContrarianLong = signalType === "contrarian-long";
  const priceFormatted =
    token.priceChange24h >= 0
      ? `+${token.priceChange24h.toFixed(2)}%`
      : `${token.priceChange24h.toFixed(2)}%`;
  const sentimentLabel = token.sentiment === "positive" ? "Bullish" : "Bearish";

  const miniPoints = Array.from({ length: 10 }, (_, i) => {
    const priceY = 15 + Math.sin(i * 0.8 + (isContrarianLong ? 2 : 0)) * 10;
    const sentY = 15 + Math.cos(i * 0.6) * 10;
    return { x: i * (60 / 9), priceY, sentY };
  });

  const priceLine = miniPoints.map((p) => `${p.x},${p.priceY}`).join(" ");
  const sentLine = miniPoints.map((p) => `${p.x},${p.sentY}`).join(" ");

  return (
    <div
      className="flat-card rounded-lg p-4 card-entrance flex flex-col gap-3"
      style={{ animationDelay: `calc(${index} * var(--stagger-base))` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flat-icon-well flex h-8 w-8 items-center justify-center text-xs font-bold ${
              isContrarianLong ? "text-success" : "text-danger"
            }`}
          >
            {token.symbol.slice(0, 3)}
          </div>
          <div>
            <p className="text-sm font-semibold">{token.symbol}</p>
            <p className="text-xs text-muted-foreground">{token.name}</p>
          </div>
        </div>
        <SentimentBadge sentiment={token.sentiment} />
      </div>

      <div className="bg-surface-elevated rounded-md flex items-center justify-between px-3 py-2 text-xs">
        <div className="flex-1">
          <svg viewBox="0 0 60 30" className="h-[30px] w-[60px]" preserveAspectRatio="none">
            <polyline points={priceLine} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
            <polyline points={sentLine} fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
          </svg>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3">
          <span className="text-muted-foreground">
            {sentimentLabel} · <span className={`font-semibold tabular-nums ${token.priceChange24h >= 0 ? "text-success" : "text-danger"}`}>
              {token.priceChange24h >= 0 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
              {priceFormatted}
            </span>
          </span>
          <span className="text-muted-foreground">Strength: <span className="font-semibold tabular-nums text-warning">{divergenceStrength}</span></span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isContrarianLong ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-danger" />
          )}
          <span className="text-xs text-muted-foreground">
            Contrarian:{" "}
            <span
              className={`font-semibold ${isContrarianLong ? "text-success" : "text-danger"}`}
            >
              {isContrarianLong ? "Long" : "Short"}
            </span>
          </span>
        </div>
        <Link
          href={`/trade?symbol=${token.symbol}`}
          className="flat-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200"
        >
          Trade This
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export function DivergenceAlerts() {
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const divergences = computeDivergences(tokenCards);

  if (divergences.length === 0) return null;

  return (
    <div className="flat-card rounded-lg p-5 industrial-screws flex flex-col gap-4 transition-all duration-300">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-warning" />
        <h2 className="text-base font-bold uppercase tracking-wider">Sentiment Divergence Alerts</h2>
        <span className="bg-warning-muted text-warning rounded-full px-2 py-0.5 text-xs font-semibold">
          {divergences.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Price and sentiment are moving in opposite directions — potential contrarian opportunities.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {divergences.map((item, i) => (
          <DivergenceCard key={item.token.symbol} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
