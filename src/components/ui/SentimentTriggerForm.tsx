"use client";

import { useState } from "react";
import { Bell, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useSentimentStore } from "@/stores/sentiment";
import { useSentimentTriggersStore } from "@/stores/sentimentTriggers";
import type { TradeDirection } from "@/types/app";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20] as const;

interface SentimentTriggerFormProps {
  symbol: string;
}

export function SentimentTriggerForm({ symbol }: SentimentTriggerFormProps) {
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState(70);
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const addTrigger = useSentimentTriggersStore((s) => s.addTrigger);

  const card = tokenCards.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
  const currentSentiment = card?.sentimentScore ?? 50;

  const isValid = size && Number(size) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    addTrigger({
      symbol: symbol.toUpperCase(),
      condition,
      threshold,
      direction,
      size: Number(size),
      leverage,
    });

    setSize("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="swiss-card bg-surface rounded-lg industrial-screws flex flex-col gap-4 p-4"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest">Sentiment Trigger</h3>
      </div>

      <div className="border border-border-muted grid rounded-md grid-cols-2 gap-1 p-1">
        <button
          type="button"
          onClick={() => setCondition("above")}
          className={`py-2 text-xs font-semibold transition-all ${
            condition === "above"
              ? "border border-border-muted bg-success text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sentiment Above
        </button>
        <button
          type="button"
          onClick={() => setCondition("below")}
          className={`py-2 text-xs font-semibold transition-all ${
            condition === "below"
              ? "border border-border-muted bg-danger text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sentiment Below
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Threshold</span>
          <span className="text-xs font-semibold text-primary">{threshold}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 -translate-y-1 flex-col items-center"
            style={{ left: `${currentSentiment}%` }}
          >
            <div className="h-4 w-0.5 bg-warning" />
            <span className="mt-0.5 bg-warning/20 px-1 text-[10px] font-medium text-warning">
              {Math.round(currentSentiment)}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Current sentiment: <span className="font-medium text-warning">{Math.round(currentSentiment)}</span>
        </p>
      </div>

      <div className="border border-border-muted grid rounded-md grid-cols-2 gap-1 p-1">
        <button
          type="button"
          onClick={() => setDirection("long")}
          className={`flex items-center justify-center gap-1 py-2 text-xs font-semibold transition-all ${
            direction === "long"
              ? "border border-border-muted bg-success text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          Long
        </button>
        <button
          type="button"
          onClick={() => setDirection("short")}
          className={`flex items-center justify-center gap-1 py-2 text-xs font-semibold transition-all ${
            direction === "short"
              ? "border border-border-muted bg-danger text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingDown className="h-3 w-3" />
          Short
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="trigger-size" className="text-xs text-muted-foreground">
          Size (USDC)
        </label>
        <input
          id="trigger-size"
          type="number"
          min="0"
          step="0.01"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="0.00"
          className="swiss-input bg-surface px-3 py-2.5 text-sm placeholder:text-muted"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Leverage — {leverage}x</span>
        <div className="flex gap-1.5">
          {LEVERAGE_OPTIONS.map((lev) => (
            <button
              key={lev}
              type="button"
              onClick={() => setLeverage(lev)}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${
                leverage === lev
                  ? "border border-border-muted bg-primary text-white"
                  : "border border-border-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="swiss-btn-accent flex items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-300"
      >
        {submitted ? (
          "Trigger Set!"
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Set Trigger for {symbol}
          </>
        )}
      </button>
    </form>
  );
}
