"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSentimentStore } from "@/stores/sentiment";
import { usePriceData } from "@/hooks/usePriceData";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Grid3x3,
} from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import type { TokenCardData } from "@/types/app";

/* ── Heatmap color helpers ── */

function getBackgroundColor(score: number): string {
  if (score <= 35) {
    const ratio = (35 - score) / 35;
    return `rgba(255, 71, 87, ${0.08 + ratio * 0.17})`;
  }
  if (score >= 65) {
    const ratio = (score - 65) / 35;
    return `rgba(34, 197, 94, ${0.08 + ratio * 0.17})`;
  }
  return "rgba(107, 122, 141, 0.08)";
}

function getBorderColor(score: number): string {
  if (score <= 35) return "rgba(255, 71, 87, 0.35)";
  if (score >= 65) return "rgba(34, 197, 94, 0.35)";
  return "rgba(107, 122, 141, 0.25)";
}

function getGlowStyle(
  velocity: number,
  score: number
): React.CSSProperties {
  if (velocity <= 0.5) return {};
  const color =
    score >= 65
      ? "34, 197, 94"
      : score <= 35
        ? "255, 71, 87"
        : "107, 122, 141";
  const intensity = Math.min(velocity / 5, 1);
  const blur = 5 + intensity * 15;
  const spread = intensity * 2;
  const opacity = 0.1 + intensity * 0.3;
  return {
    boxShadow: `0 0 ${blur}px ${spread}px rgba(${color}, ${opacity})`,
  };
}

/* ── Signal logic ── */

function getSignalInfo(score: number) {
  const confidence = Math.abs(score - 50) * 2;

  if (score >= 65) {
    return {
      type: "BUY" as const,
      color: "text-success",
      led: "led-green",
      Icon: TrendingUp,
      confidence,
    };
  }
  if (score <= 35) {
    return {
      type: "SELL" as const,
      color: "text-primary",
      led: "led-red",
      Icon: TrendingDown,
      confidence,
    };
  }
  return {
    type: "HOLD" as const,
    color: "text-warning",
    led: "led-yellow",
    Icon: Minus,
    confidence,
  };
}

/* ── Individual cell (hook-safe — usePriceData per symbol) ── */

function SignalCell({ token }: { token: TokenCardData }) {
  const { currentPrice, priceChangePct } = usePriceData(token.symbol);
  const { type, color, led, Icon, confidence } = getSignalInfo(
    token.sentimentScore
  );

  const formattedPrice = useMemo(() => {
    if (currentPrice >= 1000)
      return currentPrice.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      });
    if (currentPrice >= 1) return currentPrice.toFixed(2);
    return currentPrice.toFixed(4);
  }, [currentPrice]);

  const isPositive = priceChangePct >= 0;

  return (
    <Link
      href={`/trade?symbol=${token.symbol}`}
      className="block rounded-lg p-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border relative group"
      style={{
        backgroundColor: getBackgroundColor(token.sentimentScore),
        borderColor: getBorderColor(token.sentimentScore),
        ...getGlowStyle(token.velocity, token.sentimentScore),
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-foreground leading-none">
            {token.symbol}
          </span>
          <div className={`${led} shrink-0`} title={type} />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${color}`}
        >
          <Icon className="h-3 w-3" />
          {type}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2.5">
        <span className="font-mono text-sm tabular-nums text-foreground">
          ${formattedPrice}
        </span>
        <span
          className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${
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

      <div className="flex items-end justify-between pt-2.5 border-t border-border/30">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
              Confidence
            </span>
            <InfoTooltip
              content="Signal strength based on how far sentiment deviates from neutral. Higher confidence means stronger directional bias."
              size={11}
            />
          </div>
          <span className="font-mono text-sm tabular-nums">
            {confidence.toFixed(0)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
              Score
            </span>
            <span
              className={`font-mono tabular-nums text-sm font-bold ${
                token.sentimentScore > 50
                  ? "text-success"
                  : token.sentimentScore < 50
                    ? "text-danger"
                    : "text-foreground"
              }`}
            >
              {token.sentimentScore.toFixed(0)}
            </span>
          </div>

          <div className="swiss-btn-outline h-7 w-7 rounded flex items-center justify-center bg-surface/50 group-hover:bg-surface-elevated transition-colors">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main component ── */

export function SentimentSignalCards() {
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const isLoading = useSentimentStore((s) => s.isLoading);

  if (isLoading && tokenCards.length === 0) {
    return (
      <div className="swiss-card rounded-lg p-4 industrial-screws card-entrance relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="swiss-icon-well flex h-7 w-7 items-center justify-center">
              <Grid3x3 className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                Sentiment Command Center
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Powered by Elfa AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Live
            </span>
            <span className="led-green" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] bg-surface-elevated border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!tokenCards || tokenCards.length === 0) {
    return (
      <div className="swiss-card rounded-lg p-4 industrial-screws card-entrance relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="swiss-icon-well flex h-7 w-7 items-center justify-center">
              <Grid3x3 className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                Sentiment Command Center
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Powered by Elfa AI
              </p>
            </div>
          </div>
        </div>
        <div className="py-8 text-center text-muted-foreground">
          <Minus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-sans text-sm">
            No sentiment signals available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="swiss-card rounded-lg p-4 industrial-screws card-entrance relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="swiss-icon-well flex h-7 w-7 items-center justify-center">
            <Grid3x3 className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
              Sentiment Command Center
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Powered by Elfa AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            Live
          </span>
          <span className="led-green" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {tokenCards.map((token) => (
          <SignalCell key={token.symbol} token={token} />
        ))}
      </div>
    </div>
  );
}
