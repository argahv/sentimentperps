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
  const isHighAccuracy = accuracy > 70;

  return (
    <div className="neu-card-enhanced card-entrance p-6 flex flex-col items-center justify-center gap-4 glass-panel">
      <div className="relative w-[100px] h-[100px] flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full -rotate-90 ${isHighAccuracy ? "pulse-ring" : ""}`}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="8"
            className="neu-inset"
          />
          
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out glow-primary"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-display tabular-nums text-slate-800">
            {Math.round(accuracy)}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold font-display text-slate-800 mb-1">Your Edge</h3>
        <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1">
          Avg Response: <span className="tabular-nums text-slate-700">{avgResponseTime}s</span>
        </p>
      </div>
    </div>
  );
}
