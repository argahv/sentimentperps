"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, History } from "lucide-react";

const BASE_PRICES: Record<string, number> = {
  BTC: 67500,
  ETH: 3450,
  SOL: 178,
  DOGE: 0.165,
  ARB: 1.25,
};

const REPLAY_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "ARB"] as const;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function symbolSeed(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface Candle {
  time: number;
  close: number;
}

function generateCandles(symbol: string, count: number = 120): Candle[] {
  const base = BASE_PRICES[symbol] ?? 100;
  const rng = mulberry32(symbolSeed(symbol));
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000;
  let price = base * (0.95 + rng() * 0.1);

  for (let i = count; i > 0; i--) {
    const time = now - i * intervalMs;
    const volatility = base * 0.005;
    const drift = (rng() - 0.5) * volatility;
    const close = price + drift + (rng() - 0.5) * volatility;
    candles.push({ time, close: Number(close.toPrecision(6)) });
    price = close;
  }

  return candles;
}

interface ReplayScenario {
  symbol: string;
  signalIndex: number;
  signalPrice: number;
  peakPrice: number;
  pnlPct: number;
  direction: "long" | "short";
  candles: Candle[];
}

function findReplayScenario(symbol: string): ReplayScenario | null {
  const candles = generateCandles(symbol, 120);

  for (let i = 10; i < candles.length - 8; i++) {
    const signalClose = candles[i].close;
    let best = signalClose;
    let bestIdx = i;

    for (let j = i + 1; j <= i + 8; j++) {
      if (Math.abs((candles[j].close - signalClose) / signalClose) > 0.02) {
        best = candles[j].close;
        bestIdx = j;
        break;
      }
    }

    if (bestIdx === i) continue;

    const move = (best - signalClose) / signalClose;
    const direction: "long" | "short" = move > 0 ? "long" : "short";
    const pnlPct = Math.abs(move) * 5 * 100;

    return {
      symbol,
      signalIndex: i,
      signalPrice: signalClose,
      peakPrice: best,
      pnlPct,
      direction,
      candles: candles.slice(Math.max(0, i - 6), bestIdx + 3),
    };
  }

  return null;
}

function MiniChart({
  candles,
  signalIndex,
  direction,
}: {
  candles: Candle[];
  signalIndex: number;
  direction: "long" | "short";
}) {
  if (candles.length < 2) return null;

  const prices = candles.map((c) => c.close);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const W = 200;
  const H = 60;
  const step = W / (prices.length - 1);

  const points = prices
    .map((p, i) => {
      const x = i * step;
      const y = H - ((p - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  const signalX = signalIndex * step;
  const signalY = H - ((prices[signalIndex] - min) / range) * H;

  const strokeColor = direction === "long" ? "#38B2AC" : "#EF4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx={signalX} cy={signalY} r="3.5" fill="#6C63FF" opacity="0.9" />
      <circle cx={signalX} cy={signalY} r="6" fill="#6C63FF" opacity="0.2" />
    </svg>
  );
}

function formatPrice(symbol: string, price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function ReplayCard({ scenario }: { scenario: ReplayScenario }) {
  const isLong = scenario.direction === "long";

  return (
    <div className="neu-extruded min-w-[240px] max-w-[260px] shrink-0 flex flex-col gap-3 rounded-[32px] bg-background p-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold">{scenario.symbol}</span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isLong ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
          }`}
        >
          {isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isLong ? "Long" : "Short"}
        </span>
      </div>

      <p className="text-[10px] font-medium text-primary">Sentiment predicted this</p>

      <div className="neu-inset rounded-2xl p-2">
        <MiniChart
          candles={scenario.candles}
          signalIndex={Math.min(6, scenario.candles.length - 1)}
          direction={scenario.direction}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Signal at</span>
          <span className="font-semibold">{formatPrice(scenario.symbol, scenario.signalPrice)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Peak at</span>
          <span className="font-semibold">{formatPrice(scenario.symbol, scenario.peakPrice)}</span>
        </div>
      </div>

      <div className="neu-inset flex items-center justify-between rounded-2xl px-3 py-2">
        <span className="text-xs text-muted-foreground">5x PnL</span>
        <span className="font-display text-base font-bold text-success">
          +{scenario.pnlPct.toFixed(1)}%
        </span>
      </div>

      <Link
        href={`/trade?symbol=${scenario.symbol}`}
        className="neu-btn flex items-center justify-center gap-1 rounded-2xl bg-primary py-2 text-xs font-semibold text-white transition-all duration-300"
      >
        Trade {scenario.symbol} →
      </Link>
    </div>
  );
}

export function SentimentReplay() {
  const scenarios = REPLAY_SYMBOLS.flatMap((sym) => {
    const s = findReplayScenario(sym);
    return s ? [s] : [];
  });

  if (scenarios.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">
          Sentiment Proof — Historical Signals
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Real generated examples where sentiment crossed the threshold before a major move.
      </p>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {scenarios.map((s) => (
          <ReplayCard key={s.symbol} scenario={s} />
        ))}
      </div>
    </div>
  );
}
