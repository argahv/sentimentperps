"use client";

import Link from "next/link";
import { useSentimentStore } from "@/stores/sentiment";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import type { TokenCardData } from "@/types/app";

export function SentimentSignalCards() {
  const { tokenCards, isLoading } = useSentimentStore();

  const getSignalInfo = (score: number) => {
    const confidence = Math.abs(score - 50) * 2;
    
    if (score >= 65) {
      return {
        type: "BUY",
        color: "text-success",
        led: "led-green",
        Icon: TrendingUp,
        confidence,
      };
    }
    if (score <= 35) {
      return {
        type: "SELL",
        color: "text-primary",
        led: "led-red",
        Icon: TrendingDown,
        confidence,
      };
    }
    return {
      type: "HOLD",
      color: "text-warning",
      led: "led-yellow",
      Icon: Minus,
      confidence,
    };
  };

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flat-card shrink-0 w-[170px] p-4 flex flex-col gap-3 card-entrance"
            style={{ animationDelay: `calc(${i * 0.5} * var(--stagger-base))` }}
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-12 bg-surface-elevated animate-pulse rounded" />
              <div className="h-3 w-3 rounded-full bg-surface-elevated animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-surface-elevated animate-pulse rounded mt-1" />
            <div className="h-4 w-full bg-surface-elevated animate-pulse rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!tokenCards || tokenCards.length === 0) {
    return (
      <div className="flat-card p-6 flex flex-col items-center justify-center text-center text-muted-foreground card-entrance">
        <Minus className="h-8 w-8 mb-2 opacity-50" />
        <p className="font-sans text-sm">No sentiment signals available.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
      {tokenCards.map((token, idx) => {
        const { type, color, led, Icon, confidence } = getSignalInfo(token.sentimentScore);
        
        return (
          <div
            key={token.symbol}
            className="swiss-card shrink-0 w-[170px] p-4 flex flex-col card-entrance shadow-neu-inset"
            style={{ animationDelay: `calc(${idx * 0.2} * var(--stagger-base))` }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-display font-bold text-lg">{token.symbol}</div>
              <div className={`${led} mt-1.5`} title={type} />
            </div>
            
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className={`font-display font-bold ${color}`}>
                {type}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
                  Confidence
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {confidence.toFixed(0)}%
                </span>
              </div>
              
              <Link 
                href={`/trade?symbol=${token.symbol}`}
                className="swiss-btn-outline h-7 w-7 rounded flex items-center justify-center bg-surface hover:bg-surface-elevated transition-colors"
                title={`Trade ${token.symbol}`}
              >
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
