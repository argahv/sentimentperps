"use client";

import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  BarChart3,
  Users,
  Target,
} from "lucide-react";

interface DashboardStats {
  totalPnl: number;
  totalTrades: number;
  totalWins: number;
  winRate: number;
  sentimentAccuracy: number;
  avgPnlPct: number;
  totalTraders: number;
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

const StatCard = ({
  icon: Icon,
  label,
  value,
  suffix = "",
  prefix = "",
  color,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  prefix?: string;
  color: string;
  delay: number;
}) => (
  <div
    className="flat-card rounded-lg p-4 flex flex-col gap-1.5 card-entrance"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-2">
      <div className={`flat-icon-well p-1.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
      {prefix}
      {value}
      {suffix}
    </span>
  </div>
);

export function DashboardHeroStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
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

  const animatedPnl = useCountUp(stats?.totalPnl ?? 0);
  const animatedAccuracy = useCountUp(stats?.sentimentAccuracy ?? 0);
  const animatedWins = useCountUp(stats?.totalWins ?? 0);
  const animatedTraders = useCountUp(stats?.totalTraders ?? 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flat-card rounded-lg p-4 h-[88px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const isPositivePnl = stats.totalPnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={TrendingUp}
        label="Platform P&L"
        value={Math.abs(animatedPnl).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        prefix={isPositivePnl ? "+$" : "-$"}
        color={isPositivePnl ? "text-[var(--success)]" : "text-[var(--danger)]"}
        delay={0}
      />
      <StatCard
        icon={Target}
        label="Sentiment Accuracy"
        value={animatedAccuracy.toFixed(1)}
        suffix="%"
        color="text-[var(--primary)]"
        delay={60}
      />
      <StatCard
        icon={BarChart3}
        label="Winning Trades"
        value={Math.round(animatedWins).toLocaleString()}
        suffix={` / ${stats.totalTrades}`}
        color="text-[var(--success)]"
        delay={120}
      />
      <StatCard
        icon={Users}
        label="Active Traders"
        value={Math.round(animatedTraders).toLocaleString()}
        color="text-[var(--primary)]"
        delay={180}
      />
    </div>
  );
}
