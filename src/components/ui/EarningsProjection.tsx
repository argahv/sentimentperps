"use client";

import { useState, useMemo } from "react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface BreakdownPoint {
  date: string;
  earnings: number;
  volume: number;
}

export function EarningsProjection({
  currentEarnings,
  referralCount,
  breakdownData,
}: {
  currentEarnings: number;
  referralCount: number;
  breakdownData?: BreakdownPoint[];
}) {
  const [additional, setAdditional] = useState(5);

  const earningsPerReferral = referralCount > 0 ? currentEarnings / referralCount : 10;
  const projectedEarnings = earningsPerReferral * (referralCount + additional);

  const hasBreakdown = breakdownData && breakdownData.length > 0;

  const svgPath = useMemo(() => {
    if (!hasBreakdown) return null;

    const points = breakdownData!;
    const maxEarnings = Math.max(...points.map((p) => p.earnings), 1);
    const normalized = points.map((p, i) => ({
      x: (i / Math.max(points.length - 1, 1)) * 100,
      y: 100 - (p.earnings / maxEarnings) * 80,
    }));

    if (normalized.length === 1) {
      return {
        line: `M 0 100 L 100 ${normalized[0].y}`,
        fill: `M 0 100 L 100 ${normalized[0].y} L 100 100 L 0 100 Z`,
      };
    }

    const linePoints = normalized
      .map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
      .join(" ");
    const fillPoints = `${linePoints} L 100 100 L 0 100 Z`;

    return { line: linePoints, fill: fillPoints };
  }, [breakdownData, hasBreakdown]);

  const staticPath = `M 0 100 C 40 100, 60 20, 100 20`;
  const staticFill = `${staticPath} L 100 100 L 0 100 Z`;

  return (
    <div className="swiss-card bg-surface p-6 rounded-lg industrial-screws flex flex-col gap-6">
       <div>
         <h3 className="font-display text-lg font-bold uppercase tracking-widest flex items-center gap-2">
           Earnings Projection
           <InfoTooltip content="Estimated future earnings based on your current average reward per referral. Formula: (current earnings ÷ referrals) × (referrals + additional)." size={14} />
         </h3>
         <p className="text-sm text-muted-foreground mt-1">
           {hasBreakdown
             ? "Last 30 days trend + projected future rewards."
             : "Estimate your potential rewards based on your current performance."}
         </p>
       </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium flex justify-between">
          <span>Additional Referrals</span>
          <span className="font-bold tabular-nums text-primary">{additional}</span>
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={additional}
          onChange={(e) => setAdditional(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-primary/20 border border-border-muted"
          style={{ accentColor: "var(--color-primary)" }}
        />
      </div>

      <div className="border border-border-muted bg-surface p-5 rounded-md relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">
            If you refer <strong className="text-foreground tabular-nums">{additional}</strong> more friends, you could earn
          </p>
          <p className="text-3xl font-display font-bold text-success mt-2 tabular-nums">
            ~${projectedEarnings.toFixed(2)}
          </p>
          {hasBreakdown && (
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              Based on 30-day trend
            </p>
          )}
        </div>

        <div className="absolute right-0 bottom-0 left-20 top-4 opacity-30 pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="earnings-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={hasBreakdown && svgPath ? svgPath.fill : staticFill}
              fill="url(#earnings-gradient)"
              className="animate-in fade-in duration-1000"
            />
            <path
              d={hasBreakdown && svgPath ? svgPath.line : staticPath}
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="150"
              strokeDashoffset="150"
              style={{
                animationName: "svg-draw",
                animationDuration: "1.5s",
                animationFillMode: "forwards",
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
