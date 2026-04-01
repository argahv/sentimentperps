"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
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
import { LogIn, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { TradeDirection } from "@/types/app";

export default function TradeContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "BTC";
  const { login, authenticated, ready: privyReady } = usePrivy();

  const getMarketId = useMarketsStore((s) => s.getMarketId);
  const marketId = getMarketId(symbol);

  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const tokenCard = tokenCards.find((t) => t.symbol === symbol);

  const { isSubmitting, submitTrade, closePosition, walletAddress } = useTrade();
  const { refetch: refetchPositions } = usePositions(walletAddress, null, 15_000);
  const { candles, markers, currentPrice, priceChange, priceChangePct } = usePriceData(symbol);

  useSentimentPolling(30_000);
  useSentimentTriggerEngine();

  const isPositive = priceChange >= 0;

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
    },
    [submitTrade, refetchPositions]
  );

  const handleClosePosition = useCallback(
    async (posMarketId: string, side: TradeDirection, size: number) => {
      await closePosition(posMarketId, side, size);
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Trade — {symbol}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-lg font-semibold">${formattedPrice}</span>
            <span
              className={`flex items-center gap-0.5 text-sm font-medium ${
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

        {privyReady && !authenticated && (
          <button
            onClick={login}
            className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <PriceChart data={candles} markers={markers} symbol={symbol} />

          <div className="grid gap-6 md:grid-cols-2">
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
            <SentimentPanel symbol={symbol} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SentimentTriggerForm symbol={symbol} />
            <ActiveTriggers />
          </div>
        </div>

        <div className="w-full xl:w-72 shrink-0">
          <PositionsSidebar onClosePosition={handleClosePosition} />
        </div>
      </div>
    </div>
  );
}
