"use client";

import { useEffect, useState } from "react";
import { useSentimentStore } from "@/stores/sentiment";
import { InfoTooltip } from "./InfoTooltip";

export function SentimentConfidenceMeter({ symbol }: { symbol: string }) {
  const tokenCard = useSentimentStore((s) =>
    s.tokenCards.find((t) => t.symbol === symbol)
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const sentimentScore = tokenCard?.sentimentScore ?? 50;
  const confidence = Math.round(Math.abs(sentimentScore - 50) * 2);

  let colorVar = "var(--color-danger)";
  if (confidence >= 66) {
    colorVar = "var(--color-success)";
  } else if (confidence >= 33) {
    colorVar = "var(--color-warning, #FFD600)";
  }

  const radius = 60;
  const strokeWidth = 12;
  const cx = 80;
  const cy = 80;
  const arcLength = Math.PI * radius;

  const offset = arcLength - (confidence / 100) * arcLength;

  return (
    <div className="card-entrance flex flex-col items-center justify-center p-4">
      <div className="relative w-[160px] h-[90px] flex items-end justify-center">
        <svg
          width="160"
          height="90"
          viewBox="0 0 160 90"
          className="absolute top-0 left-0"
        >
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="var(--color-foreground)"
            strokeOpacity={0.1}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={colorVar}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={mounted ? offset : arcLength}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>

        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="tabular-nums text-2xl font-display font-bold">
            {confidence}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        Sentiment Confidence
        <InfoTooltip content="How strongly sentiment leans bullish or bearish. Calculated as distance from neutral (50) scaled to 0-100%. Higher values indicate stronger directional conviction." size={12} />
      </span>
    </div>
  );
}
