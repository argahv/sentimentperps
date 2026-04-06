"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePositionsStore } from "@/stores/positions";
import { TrendingUp, TrendingDown, Crosshair } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type TimeRange = "1D" | "1W" | "1M";

interface PnLSnapshot {
  timestamp: number;
  value: number;
}

export function PortfolioPerformanceCard() {
  const { positions, getTotalUnrealizedPnl } = usePositionsStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [history, setHistory] = useState<PnLSnapshot[]>([]);

  const currentTotalValue = getTotalUnrealizedPnl();
  
  useEffect(() => {
    setHistory([{ timestamp: Date.now(), value: currentTotalValue }]);

    const interval = setInterval(() => {
      setHistory(prev => [
        ...prev,
        { timestamp: Date.now(), value: currentTotalValue }
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentTotalValue]);

  const visibleHistory = useMemo(() => {
    const now = Date.now();
    const cutoff =
      timeRange === "1D" ? now - 86400000 :
      timeRange === "1W" ? now - 604800000 :
      now - 2592000000;
    
    const filtered = history.filter(h => h.timestamp >= cutoff);
    return filtered.length > 1 ? filtered : history;
  }, [history, timeRange]);

  const sparklinePaths = useMemo(() => {
    if (visibleHistory.length < 2) return null;

    const width = 120;
    const height = 40;
    
    const minTime = visibleHistory[0].timestamp;
    const maxTime = visibleHistory[visibleHistory.length - 1].timestamp;
    
    const values = visibleHistory.map(h => h.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    const timeRangeMs = maxTime - minTime || 1;
    const valueRange = maxValue - minValue || 1;

    const points = visibleHistory.map(h => {
      const x = ((h.timestamp - minTime) / timeRangeMs) * width;
      const y = height - ((h.value - minValue) / valueRange) * height;
      return `${x},${y}`;
    }).join(" ");

    const polylineStr = points;
    const polygonStr = `${points} ${width},${height} 0,${height}`;

    return { polyline: polylineStr, polygon: polygonStr, isPositive: currentTotalValue >= visibleHistory[0].value };
  }, [visibleHistory, currentTotalValue]);

  const pnlDiff = visibleHistory.length > 0 ? currentTotalValue - visibleHistory[0].value : 0;
  const pnlPercent = visibleHistory.length > 0 && visibleHistory[0].value !== 0 
    ? (pnlDiff / visibleHistory[0].value) * 100 
    : 0;
  const isPositive = pnlDiff >= 0;

  if (positions.length === 0) {
    return (
      <div className="flat-card rounded-lg p-8 card-entrance col-span-full industrial-screws flex flex-col items-center justify-center min-h-[240px] text-center gap-4">
        <div className="flat-icon-well p-4 rounded-full bg-surface-elevated text-primary mb-2">
          <Crosshair size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-display font-bold text-foreground">Ready to Trade?</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Open a sentiment-driven position to track your portfolio performance here.
          </p>
        </div>
        <Link 
          href="/trade" 
          className="flat-btn-primary px-6 py-2 rounded-md font-semibold mt-2 inline-flex items-center gap-2"
        >
          <TrendingUp size={16} />
          Start Trading
        </Link>
      </div>
    );
  }

  return (
    <div className="flat-card rounded-lg p-6 sm:p-8 card-entrance col-span-full industrial-screws flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">

      <div className="flex flex-col z-10">
         <div className="flex items-center gap-2 mb-1">
           <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Unrealized P&amp;L</span>
           <InfoTooltip content="Current profit or loss on open positions based on mark price. This value changes in real-time and is only realized when you close the position." />
         </div>
        <div className="flex items-baseline gap-3">
          <h2 className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${currentTotalValue >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {currentTotalValue >= 0 ? '+' : ''}${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span className={`flex items-center text-sm font-semibold tabular-nums px-2 py-1 rounded-full ${isPositive ? 'bg-success-muted text-[var(--color-success)]' : 'bg-danger-muted text-[var(--color-danger)]'}`}>
            {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
            {Math.abs(pnlDiff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Math.abs(pnlPercent).toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 w-full md:w-auto z-10">
        <div className="flex gap-2 bg-surface-elevated rounded-md p-1">
          {(["1D", "1W", "1M"] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-xs px-3 py-1 font-semibold rounded-md transition-all duration-200 ${
                timeRange === range 
                  ? "flat-btn-primary" 
                  : "bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="w-[120px] h-[40px] relative mt-2">
          {sparklinePaths ? (
            <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={sparklinePaths.polygon}
                fill="url(#sparkline-gradient)"
                className="opacity-50"
              />
              <polyline
                points={sparklinePaths.polyline}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="svg-draw glow-primary"
                style={{
                  strokeDasharray: "200",
                  strokeDashoffset: "200",
                  animationName: "svg-draw",
                  animationDuration: "1.5s",
                  animationFillMode: "forwards"
                }}
              />
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[var(--color-primary)] bar-animate" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
