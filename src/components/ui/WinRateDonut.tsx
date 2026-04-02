"use client";

import { useEffect, useState } from "react";

export function WinRateDonut({
  winRate,
  size = 80,
}: {
  winRate: number;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const targetOffset = circumference - (winRate / 100) * circumference;
  const offset = mounted ? targetOffset : circumference;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center card-entrance">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--danger)"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--success)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold tabular-nums text-foreground">
            {winRate.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
        Win Rate
      </span>
    </div>
  );
}
