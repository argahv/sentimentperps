"use client";

import { useCallback, useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignMessage } from "@privy-io/react-auth/solana";
import bs58 from "bs58";
import { useNotificationStore } from "@/stores/notifications";
import { createAuthPayload, prepareSignatureMessage } from "@/lib/pacifica";
import type { TradeDirection } from "@/types/app";

interface TradeParams {
  symbol: string;
  marketId: string;
  direction: TradeDirection;
  size: number;
  leverage: number;
  price?: number;
  stopPrice?: number;
}

export interface TradeResult {
  orderId: string;
  status: string;
}

export function useTrade() {
  const { ready: privyReady, authenticated } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const wallet = useMemo(() => {
    if (!wallets.length) return null;
    return wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0];
  }, [wallets]);

  const signPayload = useCallback(
    async (payload: Record<string, unknown>): Promise<{ walletAddress: string; signature: string }> => {
      if (!wallet) throw new Error("No wallet connected");

      const authPayload = createAuthPayload(payload);
      const messageBytes = prepareSignatureMessage(authPayload);

      const result = await signMessage({ message: messageBytes, wallet });
      const signatureBase58 = bs58.encode(result.signature);

      return { walletAddress: wallet.address, signature: signatureBase58 };
    },
    [wallet, signMessage]
  );

  const submitTrade = useCallback(
    async (params: TradeParams): Promise<TradeResult> => {
      if (!privyReady || !authenticated) throw new Error("Not authenticated");

      setIsSubmitting(true);
      setLastError(null);

      try {
        const side = params.direction === "long" ? "buy" : "sell";

        const orderPayload = {
          symbol: params.marketId,
          side,
          size: params.size,
          leverage: params.leverage,
          ...(params.price && { price: params.price }),
          ...(params.stopPrice && { stop_price: params.stopPrice }),
        };

        const { walletAddress, signature } = await signPayload(orderPayload);

        const res = await fetch("/api/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orderPayload, walletAddress, signature }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Trade failed");

        addNotification({
          type: "success",
          title: `${params.direction === "long" ? "Long" : "Short"} ${params.symbol} opened`,
          message: `${params.size} USDC at ${params.leverage}x leverage`,
        });

        return { orderId: data.order.order_id, status: data.order.status };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Trade failed";
        setLastError(message);
        addNotification({ type: "error", title: "Trade failed", message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [privyReady, authenticated, signPayload, addNotification]
  );

  const closePosition = useCallback(
    async (
      symbol: string,
      side: TradeDirection,
      size: number,
      positionMeta?: { entryPrice: number; markPrice: number; leverage: number; pnlUsdc: number }
    ): Promise<TradeResult> => {
      if (!privyReady || !authenticated) throw new Error("Not authenticated");

      setIsSubmitting(true);
      setLastError(null);

      try {
        const closePayload = { symbol, side, size };
        const { walletAddress, signature } = await signPayload(closePayload);

        const res = await fetch("/api/positions/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...closePayload, walletAddress, signature }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Close failed");

        addNotification({
          type: "success",
          title: "Position closed",
          message: `Closed ${side} on ${symbol}`,
        });

        if (positionMeta) {
          const pnlPct = positionMeta.entryPrice > 0
            ? ((positionMeta.markPrice - positionMeta.entryPrice) / positionMeta.entryPrice) * 100 * (side === "long" ? 1 : -1)
            : 0;

          fetch("/api/leaderboard/record-trade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress,
              symbol,
              direction: side,
              leverage: positionMeta.leverage,
              size,
              entryPrice: positionMeta.entryPrice,
              exitPrice: positionMeta.markPrice,
              pnlUsdc: positionMeta.pnlUsdc,
              pnlPct,
            }),
          }).catch(() => {});
        }

        return { orderId: data.order.order_id, status: data.order.status };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Close failed";
        setLastError(message);
        addNotification({ type: "error", title: "Close failed", message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [privyReady, authenticated, signPayload, addNotification]
  );

  return {
    ready: privyReady && walletsReady,
    authenticated,
    walletAddress: wallet?.address ?? null,
    isSubmitting,
    lastError,
    submitTrade,
    closePosition,
    signPayload,
  };
}
