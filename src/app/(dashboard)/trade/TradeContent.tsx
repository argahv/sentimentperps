"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSentimentPolling } from "@/hooks/useSentimentPolling";
import { useTrade } from "@/hooks/useTrade";
import { usePositions } from "@/hooks/usePositions";
import { usePriceData } from "@/hooks/usePriceData";
import { useMarketsStore } from "@/stores/markets";
import { useSentimentStore } from "@/stores/sentiment";
import { PriceChart } from "@/components/ui/PriceChart";
import { SentimentPanel } from "@/components/ui/SentimentPanel";
import { OrderForm } from "@/components/ui/OrderForm";
import { SentimentTriggerForm } from "@/components/ui/SentimentTriggerForm";
import { ActiveTriggers } from "@/components/ui/ActiveTriggers";
import { PositionsSidebar } from "@/components/ui/PositionsSidebar";
import { useSentimentTriggerEngine } from "@/hooks/useSentimentTriggerEngine";
import { SentimentConfidenceMeter } from "@/components/ui/SentimentConfidenceMeter";
import { LogIn, ArrowUpRight, ArrowDownRight, Zap, ChevronDown } from "lucide-react";
import type { TradeDirection } from "@/types/app";

export default function TradeContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "BTC";
  const { login, authenticated, ready: privyReady } = usePrivy();

  const getMarketId = useMarketsStore((s) => s.getMarketId);
  const marketId = getMarketId(symbol);

  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const tokenCard = tokenCards.find((t) => t.symbol === symbol);

  const { isSubmitting, submitTrade, closePosition, walletAddress, setTpSl } = useTrade();
  const { refetch: refetchPositions } = usePositions(walletAddress, null, 15_000);
  const { candles, markers, currentPrice, priceChange, priceChangePct } = usePriceData(symbol);

  useSentimentPolling(30_000);

  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);

  const onAutoTrade = useCallback(
    async (params: { symbol: string; direction: "long" | "short"; size: number; leverage: number }) => {
      const mId = getMarketId(params.symbol);
      if (!mId) throw new Error(`No market ID for ${params.symbol}`);
      await submitTrade({
        symbol: params.symbol,
        marketId: mId,
        direction: params.direction,
        size: params.size,
        leverage: params.leverage,
      });
      refetchPositions();
    },
    [getMarketId, submitTrade, refetchPositions]
  );

  const triggerOptions = useMemo(
    () =>
      authenticated && autoTradeEnabled
        ? { autoExecute: true as const, onAutoTrade }
        : undefined,
    [authenticated, autoTradeEnabled, onAutoTrade]
  );

  useSentimentTriggerEngine(triggerOptions);

  const isPositive = priceChange >= 0;
  const [showTriggers, setShowTriggers] = useState(false);

  const handleSubmit = useCallback(
    async (data: {
      symbol: string;
      marketId: string;
      direction: TradeDirection;
      size: number;
      leverage: number;
      takeProfit?: number;
      stopLoss?: number;
    }) => {
      if (!data.marketId) return;
      await submitTrade({
        symbol: data.symbol,
        marketId: data.marketId,
        direction: data.direction,
        size: data.size,
        leverage: data.leverage,
      });
      refetchPositions();

      if (data.takeProfit !== undefined || data.stopLoss !== undefined) {
        setTpSl({ symbol: data.symbol, takeProfit: data.takeProfit, stopLoss: data.stopLoss });
      }
    },
    [submitTrade, refetchPositions, setTpSl]
  );

  const handleClosePosition = useCallback(
    async (
      posMarketId: string,
      side: TradeDirection,
      size: number,
      positionMeta?: { entryPrice: number; markPrice: number; leverage: number; pnlUsdc: number }
    ) => {
      await closePosition(posMarketId, side, size, positionMeta);
      refetchPositions();
    },
    [closePosition, refetchPositions]
  );

  const formattedPrice = currentPrice >= 1000
    ? currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : currentPrice >= 1
      ? currentPrice.toFixed(2)
      : currentPrice.toFixed(4);

  return (
    <div className="page-enter flex flex-col gap-3 p-3 lg:gap-4 lg:p-5">
      <div
        className="card-entrance flex items-center justify-between"
        style={{ animationDelay: `calc(0 * var(--stagger-base))` }}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold lg:text-2xl">{symbol}/USDC</h1>
              <span className="bg-surface-elevated rounded-full px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Perp
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="tabular-nums text-lg font-semibold">${formattedPrice}</span>
              <span
                className={`tabular-nums flex items-center gap-0.5 text-sm font-medium ${
                  isPositive ? "text-success" : "text-danger"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {isPositive ? "+" : ""}
                {priceChangePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <SentimentConfidenceMeter symbol={symbol} />
          </div>
        </div>

        {privyReady && !authenticated && (
          <button
            onClick={login}
            className="flat-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          <div
            className="card-entrance"
            style={{ animationDelay: `calc(1 * var(--stagger-base))` }}
          >
            <PriceChart data={candles} markers={markers} symbol={symbol} height={480} />
          </div>

          <div
            className="card-entrance sm:hidden"
            style={{ animationDelay: `calc(2 * var(--stagger-base))` }}
          >
            <SentimentConfidenceMeter symbol={symbol} />
          </div>

          <div
            className="card-entrance"
            style={{ animationDelay: `calc(3 * var(--stagger-base))` }}
          >
            <SentimentPanel symbol={symbol} />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[340px] xl:w-[380px] lg:sticky lg:top-4 lg:max-h-[calc(100dvh-88px)] lg:gap-4 lg:overflow-y-auto">
          <div
            className="card-entrance"
            style={{ animationDelay: `calc(4 * var(--stagger-base))` }}
          >
            <OrderForm
              symbol={symbol}
              marketId={marketId}
              currentPrice={currentPrice}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              sentimentScore={tokenCard?.sentimentScore}
              sentimentLabel={tokenCard?.sentiment}
              sentimentVelocity={tokenCard?.velocity}
            />
          </div>

          <div
            className="card-entrance"
            style={{ animationDelay: `calc(5 * var(--stagger-base))` }}
          >
            <PositionsSidebar onClosePosition={handleClosePosition} />
          </div>

          <div
            className="card-entrance"
            style={{ animationDelay: `calc(6 * var(--stagger-base))` }}
          >
            <button
              type="button"
              onClick={() => setShowTriggers((prev) => !prev)}
              className="flat-card rounded-lg flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 hover:bg-surface-elevated"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Auto-Trade Triggers</span>
                {autoTradeEnabled && authenticated && (
                  <span className="led-indicator led-green h-2 w-2 rounded-full" />
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  showTriggers ? "rotate-180" : ""
                }`}
              />
            </button>

            {showTriggers && (
              <div className="mt-3 flex flex-col gap-3">
                {authenticated && (
                  <div className="flex items-center justify-between px-4 py-2 rounded-md bg-surface-elevated">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${autoTradeEnabled ? "led-indicator led-green" : "bg-muted-foreground/30"}`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {autoTradeEnabled ? "Auto-execute ON" : "Auto-execute OFF"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoTradeEnabled((v) => !v)}
                      className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${autoTradeEnabled ? "bg-success" : "bg-muted-foreground/30"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${autoTradeEnabled ? "translate-x-4" : ""}`}
                      />
                    </button>
                  </div>
                )}
                <SentimentTriggerForm symbol={symbol} />
                <ActiveTriggers />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
