"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CandleData, ChartMarker } from "@/components/ui/PriceChart";
import { useSentimentStore } from "@/stores/sentiment";

const BASE_PRICES: Record<string, number> = {
  BTC: 67500,
  ETH: 3450,
  SOL: 178,
  DOGE: 0.165,
  ARB: 1.25,
  AVAX: 38.5,
  MATIC: 0.72,
  LINK: 14.8,
  UNI: 7.4,
  AAVE: 92,
};

function getBasePrice(symbol: string): number {
  return BASE_PRICES[symbol.toUpperCase()] ?? 100;
}

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

function generateHistoricalCandles(symbol: string, count: number = 200): CandleData[] {
  const base = getBasePrice(symbol);
  const rng = mulberry32(symbolSeed(symbol));
  const candles: CandleData[] = [];

  const now = Date.now();
  const intervalMs = 15 * 60 * 1000;
  let price = base * (0.95 + rng() * 0.1);

  for (let i = count; i > 0; i--) {
    const time = now - i * intervalMs;
    const volatility = base * 0.005;
    const drift = (rng() - 0.5) * volatility;
    const open = price;
    const close = open + drift + (rng() - 0.5) * volatility;
    const high = Math.max(open, close) + rng() * volatility * 0.7;
    const low = Math.min(open, close) - rng() * volatility * 0.7;

    candles.push({
      time,
      open: Number(open.toPrecision(6)),
      high: Number(high.toPrecision(6)),
      low: Number(low.toPrecision(6)),
      close: Number(close.toPrecision(6)),
    });

    price = close;
  }

  return candles;
}

function generateNewCandle(prev: CandleData, symbol: string): CandleData {
  const base = getBasePrice(symbol);
  const volatility = base * 0.004;
  const open = prev.close;
  const change = (Math.random() - 0.48) * volatility;
  const close = open + change;
  const high = Math.max(open, close) + Math.random() * volatility * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * 0.5;

  return {
    time: prev.time + 15 * 60 * 1000,
    open: Number(open.toPrecision(6)),
    high: Number(high.toPrecision(6)),
    low: Number(low.toPrecision(6)),
    close: Number(close.toPrecision(6)),
  };
}

async function fetchOhlcCandles(symbol: string): Promise<CandleData[] | null> {
  try {
    const res = await fetch(`/api/ohlc?symbol=${encodeURIComponent(symbol)}&days=7`);
    if (!res.ok) return null;
    const { candles } = await res.json();
    if (!Array.isArray(candles) || candles.length < 10) return null;
    return candles as CandleData[];
  } catch {
    return null;
  }
}

export function usePriceData(symbol: string) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [markers, setMarkers] = useState<ChartMarker[]>([]);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signals = useSentimentStore((s) => s.signals);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const liveCandles = await fetchOhlcCandles(symbol);
      if (cancelled) return;

      if (liveCandles) {
        setCandles(liveCandles);
        setIsLive(true);
      } else {
        setCandles(generateHistoricalCandles(symbol));
        setIsLive(false);
      }
    }

    init();

    intervalRef.current = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const newCandle = generateNewCandle(prev[prev.length - 1], symbol);
        return [...prev.slice(-299), newCandle];
      });
    }, 10_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbol]);

  const buildMarkers = useCallback(() => {
    const signal = signals.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!signal || !candles.length) return;

    const sentimentMarkers: ChartMarker[] = [];

    if (signal.sentiment === "positive") {
      sentimentMarkers.push({
        time: candles[candles.length - 1].time,
        position: "belowBar",
        color: "#22C55E",
        shape: "arrowUp",
        text: "Bullish Signal",
      });
    } else if (signal.sentiment === "negative") {
      sentimentMarkers.push({
        time: candles[candles.length - 1].time,
        position: "aboveBar",
        color: "#EF4444",
        shape: "arrowDown",
        text: "Bearish Signal",
      });
    }

    setMarkers(sentimentMarkers);
  }, [signals, symbol, candles]);

  useEffect(() => {
    buildMarkers();
  }, [buildMarkers]);

  const currentPrice = candles.length ? candles[candles.length - 1].close : getBasePrice(symbol);
  const prevClose = candles.length > 1 ? candles[candles.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevClose;
  const priceChangePct = prevClose ? (priceChange / prevClose) * 100 : 0;

  return {
    candles,
    markers,
    currentPrice,
    priceChange,
    priceChangePct,
    isLive,
  };
}
