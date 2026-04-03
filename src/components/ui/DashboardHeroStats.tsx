"use client";

import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Target,
  Users,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalPnl: number;
  totalTrades: number;
  totalWins: number;
  winRate: number;
  sentimentAccuracy: number;
  avgPnlPct: number;
  totalTraders: number;
  source?: "database" | "live";
  signalsCounted?: number;
  signalsCorrect?: number;
}

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
};

const StatItem = ({
  label,
  value,
  suffix = "",
  prefix = "",
  color,
  size = "text-2xl",
  Icon,
  delay,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  color: string;
  size?: string;
  Icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}) => (
  <div
    className="flex items-center gap-3 p-4 bg-surface-elevated rounded-lg shadow-neu-inset border border-border-muted card-entrance"
    style={{ animationDelay: `${delay || 0}ms` }}
  >
    {Icon && (
      <div className={`flat-icon-well p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`${size} font-bold tabular-nums tracking-tight text-foreground font-mono`}>
          {prefix}
          {typeof value === "number" ? value.toLocaleString(undefined, {
            minimumFractionDigits: value % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
          }) : value}
          {suffix}
        </span>
      </div>
    </div>
  </div>
);

export function DashboardHeroStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: DashboardStats = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = stats;
  const isLiveOnly = stats?.source === "live";

  const animatedPnl = useCountUp(displayStats ? Math.abs(displayStats.totalPnl) : 0, 2000);
  const animatedAccuracy = useCountUp(displayStats ? displayStats.sentimentAccuracy : 0, 2000);

  if (isLoading) {
    return (
      <div className="flat-card rounded-lg industrial-screws p-6 animate-pulse border border-border-bright">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-display font-display">
            Loading Market Intelligence...
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 w-full bg-surface rounded-lg"></div>
          <div className="h-16 w-full bg-surface rounded-lg"></div>
          <div className="h-16 w-full bg-surface rounded-lg"></div>
          <div className="h-16 w-full bg-surface rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!displayStats) {
    return (
      <div className="flat-card rounded-lg industrial-screws p-6 text-center border border-border-bright">
        <p className="text-muted-foreground font-mono">NO SIGNAL DATA DETECTED</p>
      </div>
    );
  }

  const isPositivePnl = displayStats.totalPnl >= 0;
  const pnlColor = isPositivePnl ? "text-success" : "text-danger";
  const accuracyColor = displayStats.sentimentAccuracy >= 70
    ? "text-success"
    : displayStats.sentimentAccuracy >= 60
    ? "text-warning"
    : "text-danger";

  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (animatedAccuracy / 100) * circumference;

  return (
    <div className="flat-card rounded-lg industrial-screws p-6 relative overflow-hidden shadow-neu border border-border-bright card-entrance z-10">
      <div className="swiss-dots absolute inset-0 opacity-40 z-0 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 blur-[80px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-success opacity-5 blur-[80px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-border-muted industrial-vents">
        <div className="flex items-center gap-3">
          <div className="led-indicator led-green" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground font-mono">
            LIVE INTELLIGENCE
          </span>
        </div>
        {isLiveOnly && (
          <span className="flat-tag flat-tag-warning px-2 py-0.5">
            LIVE SIGNALS
          </span>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        <div className="lg:col-span-6 flex flex-col justify-center bg-surface rounded-xl border border-border-muted p-6 shadow-neu-inset card-entrance" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flat-icon-well p-1.5 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">
              Total Platform P&L
            </h2>
          </div>
          {displayStats.totalTrades > 0 ? (
            <>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={`text-6xl lg:text-7xl font-bold tabular-nums tracking-tighter ${pnlColor} font-mono drop-shadow-md`}>
                  {isPositivePnl ? "+$" : "-$"}
                  {animatedPnl.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <span className="flat-tag flat-tag-success px-3 py-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  {displayStats.avgPnlPct >= 0 ? "+" : ""}{displayStats.avgPnlPct.toFixed(1)}% AVG RETURN
                </span>
                <span className="flat-tag px-3 py-1 bg-surface-elevated text-muted-foreground">
                  {displayStats.totalTrades} TRADES
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <span className="text-4xl lg:text-5xl font-bold tabular-nums tracking-tighter text-muted-foreground font-mono">
                $0
              </span>
              <p className="text-xs text-muted-foreground mt-3 font-mono uppercase tracking-wider">
                No trades recorded yet — start trading to see real P&L
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col items-center justify-center bg-surface rounded-xl border border-border-muted p-6 shadow-neu-inset card-entrance" style={{ animationDelay: "200ms" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display mb-4 w-full text-left">
            Signal Accuracy
          </h2>
          
          <div className="relative flex items-center justify-center w-full max-w-[160px] aspect-[2/1] overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md overflow-visible">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--color-surface-elevated)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={animatedAccuracy >= 70 ? "var(--color-success)" : animatedAccuracy >= 60 ? "var(--color-warning)" : "var(--color-danger)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute bottom-0 left-0 w-full text-center flex flex-col items-center justify-end h-full pb-1">
              <span className={`text-4xl font-bold tabular-nums tracking-tighter ${accuracyColor} font-mono`}>
                {animatedAccuracy.toFixed(1)}<span className="text-xl ml-0.5">%</span>
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col justify-between gap-4 card-entrance" style={{ animationDelay: "300ms" }}>
          <StatItem
            label="Win Rate"
            value={displayStats.totalTrades > 0 ? displayStats.winRate : "--"}
            suffix={displayStats.totalTrades > 0 ? "%" : ""}
            color="text-success"
            Icon={Target}
            delay={350}
            size="text-3xl"
          />
          <StatItem
            label="Active Traders"
            value={displayStats.totalTraders}
            color="text-primary"
            Icon={Users}
            delay={400}
            size="text-3xl"
          />
        </div>
      </div>
    </div>
  );
}