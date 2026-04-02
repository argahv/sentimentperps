"use client";

import { useMemo } from "react";
import { useSentimentStore } from "@/stores/sentiment";

export function YourEdgeCard() {
  const { tokenCards } = useSentimentStore();

  const { accuracy, avgResponseTime } = useMemo(() => {
    if (tokenCards.length === 0) {
      return { accuracy: 0, avgResponseTime: 0 };
    }

    let correctCount = 0;
    tokenCards.forEach((token) => {
      const isPositiveCorrect = token.sentiment === "positive" && token.priceChange24h > 0;
      const isNegativeCorrect = token.sentiment === "negative" && token.priceChange24h < 0;
      if (isPositiveCorrect || isNegativeCorrect) {
        correctCount++;
      }
    });

    return {
      accuracy: (correctCount / tokenCards.length) * 100,
      avgResponseTime: 4.2 
    };
  }, [tokenCards]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - accuracy / 100);

  return (
    <div className="swiss-card bg-surface card-entrance p-6 rounded-lg flex flex-col items-center justify-center gap-4">
      <div className="relative w-[100px] h-[100px] flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--border-muted)"
            strokeWidth="8"
          />
          
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out glow-primary"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-display tabular-nums text-foreground">
            {Math.round(accuracy)}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold font-display uppercase tracking-widest text-foreground mb-1">Your Edge</h3>
        <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1">
          Avg Response: <span className="tabular-nums text-foreground">{avgResponseTime}s</span>
        </p>
      </div>
    </div>
  );
}
