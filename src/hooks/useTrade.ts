"use client";

import { useCallback, useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignMessage } from "@privy-io/react-auth/solana";
import bs58 from "bs58";
import { useNotificationStore } from "@/stores/notifications";
import {
  createSignatureHeader,
  prepareSignatureMessage,
  BUILDER_CODE,
  DEFAULT_BUILDER_FEE_RATE,
} from "@/lib/pacifica";
import type { TradeDirection } from "@/types/app";
import type { PacificaOrderSide, TimeInForce } from "@/types/pacifica";

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

  // Use the first available wallet — don't deprioritize Privy embedded wallets,
  // since the user's beta access is tied to whichever wallet redeemed the code.
  const wallet = useMemo(() => {
    if (!wallets.length) return null;
    return wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0];
  }, [wallets]);

  const signPayload = useCallback(
    async (
      type: string,
      data: Record<string, unknown>,
    ): Promise<{
      walletAddress: string;
      signature: string;
      timestamp: number;
      expiry_window: number;
    }> => {
      if (!wallet) throw new Error("No wallet connected");

      const header = createSignatureHeader(type);
      const messageBytes = prepareSignatureMessage(header, data);

      const result = await signMessage({ message: messageBytes, wallet });
      const signatureBase58 = bs58.encode(result.signature);

      return {
        walletAddress: wallet.address,
        signature: signatureBase58,
        timestamp: header.timestamp,
        expiry_window: header.expiry_window,
      };
    },
    [wallet, signMessage],
  );

  const submitTrade = useCallback(
    async (params: TradeParams): Promise<TradeResult> => {
      if (!privyReady || !authenticated) throw new Error("Not authenticated");

      setIsSubmitting(true);
      setLastError(null);

      try {
        const pacificaSide: PacificaOrderSide =
          params.direction === "long" ? "bid" : "ask";
        const isMarket = !params.price;

        let orderFields: Record<string, unknown>;
        let signType: string;

        if (isMarket) {
          signType = "create_market_order";
          orderFields = {
            symbol: params.marketId,
            side: pacificaSide,
            amount: String(params.size),
            slippage_percent: "0.5",
            reduce_only: false,
            ...(params.leverage !== undefined && { leverage: params.leverage }),
          };
        } else {
          signType = "create_order";
          orderFields = {
            symbol: params.marketId,
            side: pacificaSide,
            price: String(params.price),
            amount: String(params.size),
            tif: "GTC" as TimeInForce,
            reduce_only: false,
            ...(params.leverage !== undefined && { leverage: params.leverage }),
          };
        }

        const { walletAddress, signature, timestamp, expiry_window } =
          await signPayload(signType, orderFields);

        const res = await fetch("/api/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderFields,
            isMarket,
            walletAddress,
            signature,
            timestamp,
            expiry_window,
          }),
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
    [privyReady, authenticated, signPayload, addNotification],
  );

  const closePosition = useCallback(
    async (
      symbol: string,
      side: TradeDirection,
      size: number,
      positionMeta?: {
        entryPrice: number;
        markPrice: number;
        leverage: number;
        pnlUsdc: number;
      },
    ): Promise<TradeResult> => {
      if (!privyReady || !authenticated) throw new Error("Not authenticated");

      setIsSubmitting(true);
      setLastError(null);

      try {
        const closeSide: PacificaOrderSide = side === "long" ? "ask" : "bid";

        const closeFields: Record<string, unknown> = {
          symbol,
          side: closeSide,
          amount: String(size),
          slippage_percent: "0.5",
          reduce_only: true,
        };

        const { walletAddress, signature, timestamp, expiry_window } =
          await signPayload("create_market_order", closeFields);

        const res = await fetch("/api/positions/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...closeFields,
            walletAddress,
            signature,
            timestamp,
            expiry_window,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Close failed");

        addNotification({
          type: "success",
          title: "Position closed",
          message: `Closed ${side} on ${symbol}`,
        });

        if (positionMeta) {
          const pnlPct =
            positionMeta.entryPrice > 0
              ? ((positionMeta.markPrice - positionMeta.entryPrice) /
                  positionMeta.entryPrice) *
                100 *
                (side === "long" ? 1 : -1)
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
    [privyReady, authenticated, signPayload, addNotification],
  );

  const setTpSl = useCallback(
    async (params: {
      symbol: string;
      takeProfit?: number;
      stopLoss?: number;
    }) => {
      try {
        const tpslData: Record<string, unknown> = {
          symbol: params.symbol,
          action: "set_tpsl",
        };
        const {
          walletAddress: addr,
          signature,
          timestamp,
          expiry_window,
        } = await signPayload("set_position_tpsl", tpslData);
        const res = await fetch("/api/positions/tpsl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: params.symbol,
            takeProfit: params.takeProfit,
            stopLoss: params.stopLoss,
            walletAddress: addr,
            signature,
            timestamp,
            expiry_window,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "TP/SL update failed");
        }
        addNotification({
          type: "success",
          title: "TP/SL Set",
          message: `Updated for ${params.symbol}`,
          duration: 4000,
        });
      } catch (err) {
        addNotification({
          type: "error",
          title: "TP/SL Failed",
          message: err instanceof Error ? err.message : "Unknown error",
          duration: 6000,
        });
      }
    },
    [signPayload, addNotification],
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
    setTpSl,
  };
}
