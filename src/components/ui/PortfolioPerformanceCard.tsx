"use client";

import { useState, useEffect, useMemo } from "react";
import { usePositionsStore } from "@/stores/positions";
import { TrendingUp, TrendingDown } from "lucide-react";

type TimeRange = "1D" | "1W" | "1M";

interface PnLSnapshot {
  timestamp: number;
  value: number;
}

export function PortfolioPerformanceCard() {
  const { positions, getTotalUnrealizedPnl } = usePositionsStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [history, setHistory] = useState<PnLSnapshot[]>([]);

  const totalMargin = positions.reduce((sum, pos) => sum + pos.margin, 0);
  const currentTotalValue = totalMargin + getTotalUnrealizedPnl();
  
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
      <div className="neu-card-enhanced card-entrance col-span-full p-6 flex items-center justify-center min-h-[160px]">
        <p className="text-gray-500 font-display">No positions yet</p>
      </div>
    );
  }

  return (
    <div className="neu-card-enhanced card-entrance col-span-full p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative glass-panel">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] opacity-5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex flex-col z-10">
        <span className="text-sm font-medium text-gray-500 mb-1">Total Portfolio Value</span>
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tabular-nums font-display tracking-tight text-slate-800">
            ${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span className={`flex items-center text-sm font-semibold tabular-nums px-2 py-1 rounded-full neu-inset ${isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
            {Math.abs(pnlDiff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Math.abs(pnlPercent).toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 w-full md:w-auto z-10">
        <div className="flex gap-2 bg-gray-200/50 p-1 rounded-full neu-inset">
          {(["1D", "1W", "1M"] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`neu-btn text-xs px-3 py-1 font-semibold rounded-full transition-all duration-200 ${
                timeRange === range 
                  ? "bg-white text-[var(--primary)] shadow-sm" 
                  : "bg-transparent shadow-none text-gray-500 hover:text-gray-700"
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
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
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
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="svg-draw drop-shadow-sm glow-primary"
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
              <div className="w-full h-1 bg-gray-200 rounded-full neu-inset overflow-hidden">
                <div className="h-full w-1/3 bg-[var(--primary)] rounded-full bar-animate" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}