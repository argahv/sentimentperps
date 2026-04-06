"use client";

import Link from "next/link";
import { useSentimentStore } from "@/stores/sentiment";
import { Grid3x3, TrendingUp, TrendingDown, Minus } from "lucide-react";

function getBackgroundColor(score: number): string {
  if (score < 50) {
    const ratio = 1 - score / 50;
    return `rgba(255, 71, 87, ${0.1 + ratio * 0.05})`;
  }
  if (score > 50) {
    const ratio = (score - 50) / 50;
    return `rgba(34, 197, 94, ${0.1 + ratio * 0.05})`;
  }
  return "rgba(107, 122, 141, 0.1)";
}

function getBorderColor(score: number): string {
  if (score < 45) return "rgba(255, 71, 87, 0.3)";
  if (score > 55) return "rgba(34, 197, 94, 0.3)";
  return "rgba(107, 122, 141, 0.3)";
}

function getGlowStyle(velocity: number, score: number): React.CSSProperties {
  if (velocity <= 0.5) return {};
  const color = score > 50 ? "34, 197, 94" : score < 50 ? "255, 71, 87" : "107, 122, 141";
  const intensity = Math.min(velocity / 5, 1);
  const blur = 5 + intensity * 15;
  const spread = intensity * 2;
  const opacity = 0.1 + intensity * 0.3;
  return { boxShadow: `0 0 ${blur}px ${spread}px rgba(${color}, ${opacity})` };
}

export function SentimentHeatmap() {
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const isLoading = useSentimentStore((s) => s.isLoading);

  return (
    <div className="swiss-card rounded-lg p-4 industrial-screws card-entrance relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="swiss-icon-well flex h-7 w-7 items-center justify-center">
            <Grid3x3 className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
              Sentiment Heatmap
            </h2>
            <p className="text-[10px] text-muted-foreground">Powered by Elfa AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
          <span className="led-green" />
        </div>
      </div>

      {isLoading && tokenCards.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-elevated border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : tokenCards.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded bg-surface">
          No sentiment data available
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {tokenCards.map((token) => (
            <Link
              key={token.symbol}
              href={`/trade?symbol=${token.symbol}`}
              className="block rounded p-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border"
              style={{
                backgroundColor: getBackgroundColor(token.sentimentScore),
                borderColor: getBorderColor(token.sentimentScore),
                ...getGlowStyle(token.velocity, token.sentimentScore),
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-display font-bold text-foreground text-lg leading-none">
                  {token.symbol}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-mono text-xs tabular-nums ${
                    token.priceChange24h > 0
                      ? "text-success"
                      : token.priceChange24h < 0
                        ? "text-danger"
                        : "text-muted-foreground"
                  }`}
                >
                  {token.priceChange24h > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : token.priceChange24h < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-muted-foreground text-[10px] font-mono uppercase">Score</span>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}