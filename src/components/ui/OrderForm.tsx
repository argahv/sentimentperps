"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { TradeConfirmationModal } from "@/components/ui/TradeConfirmationModal";
import { SentimentSparkline } from "@/components/ui/SentimentSparkline";
import { useSentimentStore } from "@/stores/sentiment";
import { usePositionsStore } from "@/stores/positions";
import type { TradeDirection } from "@/types/app";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20] as const;

function getSuggestedLeverage(score: number, sentiment: "positive" | "negative"): number {
  const confidence = sentiment === "positive" ? score : 100 - score;
  if (confidence >= 80) return 10;
  if (confidence >= 70) return 5;
  return 2;
}

interface OrderFormProps {
  symbol: string;
  marketId: string | null;
  currentPrice?: number;
  isSubmitting?: boolean;
  sentimentScore?: number;
  sentimentLabel?: "positive" | "negative" | "neutral";
  sentimentVelocity?: number;
  onSubmit?: (data: {
    symbol: string;
    marketId: string;
    direction: TradeDirection;
    size: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
}

export function OrderForm({
  symbol,
  marketId,
  currentPrice,
  isSubmitting,
  sentimentScore,
  sentimentLabel,
  sentimentVelocity,
  onSubmit,
}: OrderFormProps) {
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const signalFromStore = useSentimentStore((s) => s.getSignalBySymbol(symbol));
  const currentVelocity = sentimentVelocity ?? signalFromStore?.velocity ?? 0;

  const positions = usePositionsStore((s) => s.positions);
  const avgSize = positions.length > 0 ? positions.reduce((s, p) => s + p.margin, 0) / Math.min(positions.length, 10) : 0;

  const sizeNum = Number(size);
  const isValid = !!marketId && size !== "" && sizeNum > 0;

  const tpNum = takeProfit ? Number(takeProfit) : undefined;
  const slNum = stopLoss ? Number(stopLoss) : undefined;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!marketId) return;
    setShowModal(false);
    onSubmit?.({
      symbol,
      marketId,
      direction,
      size: sizeNum,
      leverage,
      ...(tpNum && { takeProfit: tpNum }),
      ...(slNum && { stopLoss: slNum }),
    });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const hasSuggestion =
    sentimentScore !== undefined &&
    sentimentLabel !== undefined &&
    sentimentLabel !== "neutral";

  const suggestedDirection: TradeDirection | null = hasSuggestion
    ? sentimentLabel === "positive"
      ? "long"
      : "short"
    : null;

  const suggestedLeverage =
    hasSuggestion && sentimentScore !== undefined
      ? getSuggestedLeverage(sentimentScore, sentimentLabel as "positive" | "negative")
      : null;

  const confidence =
    hasSuggestion && sentimentScore !== undefined
      ? sentimentLabel === "positive"
        ? sentimentScore
        : 100 - sentimentScore
      : null;

  const handleApplySuggestion = () => {
    if (suggestedDirection) setDirection(suggestedDirection);
    if (suggestedLeverage) setLeverage(suggestedLeverage);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="swiss-card bg-surface rounded-lg industrial-screws flex flex-col gap-4 p-4">
        <h3 className="text-sm font-semibold font-display uppercase tracking-widest">Place Order — {symbol}</h3>

        <div className="border border-border-muted p-2 rounded-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sentiment Velocity</span>
            <span className="text-xs font-semibold text-primary">{currentVelocity.toFixed(1)}/min</span>
          </div>
          <SentimentSparkline symbol={symbol} currentVelocity={currentVelocity} />
        </div>

        {hasSuggestion && suggestedDirection && suggestedLeverage !== null && confidence !== null && (
          <div className="border border-border-muted flex flex-col rounded-md gap-2 p-3 transition-all duration-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`relative flex h-2 w-2 shrink-0`}
                >
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      sentimentLabel === "positive" ? "bg-success" : "bg-danger"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      sentimentLabel === "positive" ? "bg-success" : "bg-danger"
                    }`}
                  />
                </span>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  AI Sentiment suggests:{" "}
                  <span
                    className={
                      suggestedDirection === "long" ? "text-success" : "text-danger"
                    }
                  >
                    {suggestedDirection === "long" ? "Long" : "Short"} {symbol}
                  </span>
                  , {suggestedLeverage}x
                  <span className="text-muted-foreground">
                    {" "}(confidence: {confidence}%)
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="swiss-btn-accent shrink-0 px-3 py-1 text-xs font-semibold text-white transition-all duration-300"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="border border-border-muted relative grid rounded-md grid-cols-2 gap-1 p-1">
          <div
            className="absolute bottom-1 top-1 w-[calc(50%-6px)] transition-transform duration-200 ease-in-out"
            style={{
              transform: direction === "long" ? "translateX(4px)" : "translateX(calc(100% + 8px))",
              backgroundColor: direction === "long" ? "var(--success)" : "var(--danger)",
              opacity: direction === "long" ? 1 : 0.6,
            }}
          />
          <button
            type="button"
            onClick={() => setDirection("long")}
            disabled={isSubmitting}
            className={`relative z-10 py-2 text-sm font-semibold transition-all ${
              direction === "long"
                ? "border border-border-muted text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setDirection("short")}
            disabled={isSubmitting}
            className={`relative z-10 py-2 text-sm font-semibold transition-all ${
              direction === "short"
                ? "border border-border-muted text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Short
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="size" className="text-xs text-muted-foreground">
            Size (USDC)
          </label>
          <input
            id="size"
            type="number"
            min="0"
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={avgSize > 0 ? `Suggested: ${avgSize.toFixed(2)}` : "0.00"}
            disabled={isSubmitting}
            className="swiss-input bg-surface px-3 py-2.5 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none focus:border-foreground transition-colors"
          />
          {avgSize > 0 && <span className="text-[10px] text-muted-foreground">Based on your avg position</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="tabular-nums text-xs text-muted-foreground">
            Leverage — {leverage}x
          </span>
          <div className="flex gap-1.5">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                disabled={isSubmitting}
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
          type="button"
          onClick={() => setShowTpSl((prev) => !prev)}
          className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {showTpSl ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide TP / SL
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Add TP / SL
            </>
          )}
        </button>

        {showTpSl && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="takeProfit" className="text-xs text-muted-foreground">
                Take Profit ($)
              </label>
              <input
                id="takeProfit"
                type="number"
                min="0"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="—"
                disabled={isSubmitting}
                className="swiss-input bg-surface px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stopLoss" className="text-xs text-muted-foreground">
                Stop Loss ($)
              </label>
              <input
                id="stopLoss"
                type="number"
                min="0"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="—"
                disabled={isSubmitting}
                className="swiss-input bg-surface px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>
        )}

        {!marketId && (
          <div className="border border-border-muted p-3 rounded-md text-center text-xs text-muted-foreground">
            {symbol} is not available for trading on Pacifica
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`swiss-btn-accent flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            isSubmitting ? "animate-pulse" : ""
          } ${
            direction === "long"
              ? "bg-success"
              : "bg-danger"
          }`}
        >
          {direction === "long" ? "Open Long" : "Open Short"} {symbol}
        </button>
      </form>

      <TradeConfirmationModal
        isOpen={showModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting ?? false}
        direction={direction}
        symbol={symbol}
        size={sizeNum}
        leverage={leverage}
        currentPrice={currentPrice ?? 0}
        takeProfit={tpNum}
        stopLoss={slNum}
      />
    </>
  );
}
