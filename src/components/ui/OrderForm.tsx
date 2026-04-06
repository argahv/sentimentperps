"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, Zap, TrendingUp, TrendingDown, Bell, Wallet } from "lucide-react";
import { TradeConfirmationModal } from "@/components/ui/TradeConfirmationModal";
import { DepositBridgeModal } from "@/components/ui/DepositBridgeModal";
import { SentimentSparkline } from "@/components/ui/SentimentSparkline";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useSentimentStore } from "@/stores/sentiment";
import { usePositionsStore } from "@/stores/positions";
import { useMarketsStore } from "@/stores/markets";
import { useSentimentTriggersStore } from "@/stores/sentimentTriggers";
import type { TradeDirection } from "@/types/app";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20] as const;

function getSuggestedLeverage(
  score: number,
  sentiment: "positive" | "negative",
  existingPositionCount: number,
  totalMarginUsed: number,
): number {
  const confidence = sentiment === "positive" ? score : 100 - score;
  const baseLeverage = confidence >= 80 ? 10 : confidence >= 70 ? 5 : 2;

  const positionPenalty = existingPositionCount >= 5 ? 2 : existingPositionCount >= 3 ? 1 : 0;
  const marginPenalty = totalMarginUsed >= 500 ? 2 : totalMarginUsed >= 200 ? 1 : 0;

  return Math.max(1, baseLeverage - positionPenalty - marginPenalty);
}

interface OrderFormProps {
  symbol: string;
  marketId: string | null;
  currentPrice?: number;
  isSubmitting?: boolean;
  lastError?: string | null;
  sentimentScore?: number;
  sentimentLabel?: "positive" | "negative" | "neutral";
  sentimentVelocity?: number;
  authenticated?: boolean;
  onLogin?: () => void;
  autoTradeEnabled?: boolean;
  onAutoTradeToggle?: (enabled: boolean) => void;
  accountEquity?: number | null;
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
  lastError,
  sentimentScore,
  sentimentLabel,
  sentimentVelocity,
  authenticated,
  onLogin,
  autoTradeEnabled,
  onAutoTradeToggle,
  accountEquity,
  onSubmit,
}: OrderFormProps) {
  const [mode, setMode] = useState<"order" | "trigger">("order");
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const [triggerCondition, setTriggerCondition] = useState<"above" | "below">("above");
  const [triggerThreshold, setTriggerThreshold] = useState(70);
  const [triggerSubmitted, setTriggerSubmitted] = useState(false);

  const signalFromStore = useSentimentStore((s) => s.getSignalBySymbol(symbol));
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const currentVelocity = sentimentVelocity ?? signalFromStore?.velocity ?? 0;
  const card = tokenCards.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
  const currentSentiment = card?.sentimentScore ?? sentimentScore ?? 50;

  const positions = usePositionsStore((s) => s.positions);
  const totalMarginUsed = positions.reduce((s, p) => s + p.margin, 0);
  const avgSize = positions.length > 0 ? totalMarginUsed / Math.min(positions.length, 10) : 0;

  const getMarketBySymbol = useMarketsStore((s) => s.getMarketBySymbol);
  const market = marketId ? getMarketBySymbol(marketId) : undefined;
  const minOrderUsdc = market?.min_order_size ?? 10;

  const addTrigger = useSentimentTriggersStore((s) => s.addTrigger);

  const sizeNum = Number(size);
  const belowMin = size !== "" && sizeNum > 0 && sizeNum < minOrderUsdc;
  const isTriggerValid = size !== "" && sizeNum > 0;

  const tpNum = takeProfit ? Number(takeProfit) : undefined;
  const slNum = stopLoss ? Number(stopLoss) : undefined;

  // TP/SL validation — long: TP > price, SL < price; short: TP < price, SL > price
  const tpError = tpNum !== undefined && currentPrice
    ? direction === "long"
      ? tpNum <= currentPrice ? `TP must be above $${currentPrice.toLocaleString()}` : null
      : tpNum >= currentPrice ? `TP must be below $${currentPrice.toLocaleString()}` : null
    : null;
  const slError = slNum !== undefined && currentPrice
    ? direction === "long"
      ? slNum >= currentPrice ? `SL must be below $${currentPrice.toLocaleString()}` : null
      : slNum <= currentPrice ? `SL must be above $${currentPrice.toLocaleString()}` : null
    : null;
  const hasTpSlError = tpError !== null || slError !== null;
  const isOrderValid = !!marketId && size !== "" && sizeNum >= minOrderUsdc && !hasTpSlError;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "order") {
      if (!isOrderValid) return;
      setShowModal(true);
    } else {
      if (!isTriggerValid) return;
      addTrigger({
        symbol: symbol.toUpperCase(),
        condition: triggerCondition,
        threshold: triggerThreshold,
        direction,
        size: sizeNum,
        leverage,
      });
      setSize("");
      setTriggerSubmitted(true);
      setTimeout(() => setTriggerSubmitted(false), 2500);
    }
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
      ? getSuggestedLeverage(sentimentScore, sentimentLabel as "positive" | "negative", positions.length, totalMarginUsed)
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold font-display uppercase tracking-widest">{symbol}/USDC</h3>
          {authenticated && onAutoTradeToggle && mode === "trigger" && (
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${autoTradeEnabled ? "led-indicator led-green" : "bg-muted-foreground/30"}`} />
              <span className="text-[10px] text-muted-foreground">
                {autoTradeEnabled ? "Auto-exec ON" : "Auto-exec OFF"}
              </span>
              <button
                type="button"
                onClick={() => onAutoTradeToggle(!autoTradeEnabled)}
                className={`relative h-4 w-8 rounded-full transition-colors duration-200 ${autoTradeEnabled ? "bg-success" : "bg-muted-foreground/30"}`}
                aria-label="Toggle auto-execute"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-200 ${autoTradeEnabled ? "translate-x-3.5" : ""}`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="border border-border-muted flex p-1 w-full rounded-md">
          <button
            type="button"
            onClick={() => setMode("order")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold transition-all rounded-sm ${
              mode === "order"
                ? "border border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Place Order
          </button>
          <button
            type="button"
            onClick={() => setMode("trigger")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold transition-all rounded-sm ${
              mode === "trigger"
                ? "border border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-3 w-3" />
            Auto-Trigger
          </button>
        </div>

        <div className="border border-border-muted p-2 rounded-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sentiment Velocity</span>
              <InfoTooltip content="Rate of social media mentions per minute for this token. Higher velocity indicates rapidly growing attention and potential price movement." size={12} />
            </div>
            <span className="text-xs font-semibold text-primary">{currentVelocity.toFixed(1)}/min</span>
          </div>
          <SentimentSparkline symbol={symbol} currentVelocity={currentVelocity} />
        </div>

        {mode === "trigger" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Trigger when sentiment is</span>
              <div className="border border-border-muted relative grid grid-cols-2 gap-1 rounded-md p-1">
                <div
                  className="absolute bottom-1 top-1 w-[calc(50%-6px)] transition-transform duration-200 ease-in-out bg-primary/20 rounded-sm"
                  style={{
                    transform: triggerCondition === "above" ? "translateX(4px)" : "translateX(calc(100% + 8px))",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTriggerCondition("above")}
                  className={`relative z-10 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-all ${
                    triggerCondition === "above" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  Above
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerCondition("below")}
                  className={`relative z-10 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-all ${
                    triggerCondition === "below" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingDown className="h-3 w-3" />
                  Below
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Threshold</span>
                <span className="tabular-nums text-xs font-semibold text-foreground">{triggerThreshold}</span>
              </div>
              <div className="relative flex flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={triggerThreshold}
                  onChange={(e) => setTriggerThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>0</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]">Now:</span>
                    <span className="tabular-nums font-semibold text-foreground">{Math.round(currentSentiment)}</span>
                  </div>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "order" && hasSuggestion && suggestedDirection && suggestedLeverage !== null && confidence !== null && (
          <div className="border border-border-muted flex flex-col rounded-md gap-2 p-3 transition-all duration-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
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
                  AI suggests:{" "}
                  <span className={suggestedDirection === "long" ? "text-success" : "text-danger"}>
                    {suggestedDirection === "long" ? "Long" : "Short"} {symbol}
                  </span>
                  , {suggestedLeverage}x
                  <span className="text-muted-foreground"> ({confidence}%)</span>
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
              backgroundColor: direction === "long" ? "var(--color-success)" : "var(--color-danger)",
              opacity: direction === "long" ? 1 : 0.6,
            }}
          />
          <button
            type="button"
            onClick={() => setDirection("long")}
            disabled={isSubmitting}
            aria-pressed={direction === "long"}
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
            aria-pressed={direction === "short"}
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
          <div className="flex items-center gap-1.5">
            <label htmlFor="size" className="text-xs text-muted-foreground">
              Size (USDC)
            </label>
            <InfoTooltip content="The amount in USDC you want to trade. This is your position size before leverage is applied." size={12} />
          </div>
          <input
            id="size"
            type="number"
            min={mode === "order" ? minOrderUsdc : 1}
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={
              mode === "order"
                ? avgSize >= minOrderUsdc
                  ? `Suggested: ${avgSize.toFixed(2)}`
                  : `Min: $${minOrderUsdc}`
                : "Amount (USDC)"
            }
            disabled={isSubmitting}
            className={`swiss-input bg-surface px-3 py-2.5 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none transition-colors ${
              belowMin && mode === "order" ? "border-warning focus:border-warning" : "focus:border-foreground"
            }`}
          />
          {mode === "order" ? (
            belowMin ? (
              <span className="flex items-center gap-1 text-[10px] text-warning">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Minimum order is ${minOrderUsdc} USDC
              </span>
            ) : avgSize >= minOrderUsdc ? (
              <span className="text-[10px] text-muted-foreground">Based on your avg position</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Min order: ${minOrderUsdc} USDC</span>
            )
          ) : (
            <span className="text-[10px] text-muted-foreground">Trade size when trigger fires</span>
          )}

           {mode === "order" && accountEquity != null && (
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Wallet className="h-3 w-3" />
                  Pacifica Balance
                </span>
                <InfoTooltip content="Your available trading balance on Pacifica exchange. This is the equity you can use to open new positions." size={12} />
              </div>
              <span className={`text-[10px] font-mono font-semibold ${
                sizeNum > 0 && sizeNum > accountEquity ? "text-danger" : "text-success"
              }`}>
                ${accountEquity.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums text-xs text-muted-foreground">
              Leverage — {leverage}x
            </span>
            <InfoTooltip content="Multiplier applied to your position size. Higher leverage amplifies both gains and losses. Max 20x." size={12} />
          </div>
          <div className="flex gap-1.5">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                disabled={isSubmitting}
                aria-pressed={leverage === lev}
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

        {mode === "order" && (
          <>
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
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="takeProfit" className="text-xs text-muted-foreground">
                      Take Profit ($)
                    </label>
                    <InfoTooltip content="Price at which your position automatically closes in profit. For longs, set above entry; for shorts, set below entry." size={12} />
                  </div>
                  <input
                    id="takeProfit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="—"
                    disabled={isSubmitting}
                    className={`swiss-input bg-surface px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none transition-colors ${
                      tpError ? "border-danger focus:border-danger" : "focus:border-foreground"
                    }`}
                  />
                  {tpError && (
                    <span className="flex items-center gap-1 text-[10px] text-danger">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {tpError}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="stopLoss" className="text-xs text-muted-foreground">
                      Stop Loss ($)
                    </label>
                    <InfoTooltip content="Price at which your position automatically closes to limit losses. For longs, set below entry; for shorts, set above entry." size={12} />
                  </div>
                  <input
                    id="stopLoss"
                    type="number"
                    min="0"
                    step="0.01"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="—"
                    disabled={isSubmitting}
                    className={`swiss-input bg-surface px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50 focus:outline-none transition-colors ${
                      slError ? "border-danger focus:border-danger" : "focus:border-foreground"
                    }`}
                  />
                  {slError && (
                    <span className="flex items-center gap-1 text-[10px] text-danger">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {slError}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {mode === "order" && lastError && (
          <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger" />
            <span className="text-xs text-danger">{lastError}</span>
          </div>
        )}

        {mode === "order" && !marketId && (
          <div className="border border-border-muted p-3 rounded-md text-center text-xs text-muted-foreground">
            {symbol} is not available for trading on Pacifica
          </div>
        )}

        {triggerSubmitted ? (
          <div className="flex items-center justify-center gap-2 rounded-md bg-success/10 border border-success/30 py-3 text-sm font-semibold text-success">
            <Bell className="h-4 w-4" />
            Trigger set! Check the Triggers tab below.
          </div>
        ) : mode === "order" && !authenticated ? (
          <button
            type="button"
            onClick={onLogin}
            className="swiss-btn-accent flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition-all duration-200 bg-primary"
          >
            Connect Wallet to Trade
          </button>
        ) : mode === "order" ? (
          <button
            type="submit"
            disabled={!isOrderValid || isSubmitting}
            className={`swiss-btn-accent flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              isSubmitting ? "animate-pulse" : ""
            } ${direction === "long" ? "bg-success" : "bg-danger"}`}
          >
            {direction === "long" ? "Open Long" : "Open Short"} {symbol}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isTriggerValid}
            className="swiss-btn-accent flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-primary"
          >
            <Zap className="h-4 w-4" />
            Set Trigger — {direction === "long" ? "Long" : "Short"} when sentiment {triggerCondition} {triggerThreshold}
          </button>
        )}
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
        pacificaEquity={accountEquity}
        onOpenDeposit={() => {
          setShowModal(false);
          setShowDeposit(true);
        }}
      />

      <DepositBridgeModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </>
  );
}
