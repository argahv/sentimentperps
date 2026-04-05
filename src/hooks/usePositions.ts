"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePositionsStore } from "@/stores/positions";
import type { PacificaTradeFill } from "@/types/pacifica";

function mapFillToClosedPosition(fill: PacificaTradeFill) {
  const isClose = fill.side === "close_long" || fill.side === "close_short";
  const displaySide = fill.side === "close_long" || fill.side === "open_long" ? "long" : "short";

  return {
    position_id: String(fill.history_id),
    symbol: fill.symbol,
    side: displaySide as "long" | "short",
    size: parseFloat(fill.amount) || 0,
    entry_price: parseFloat(fill.entry_price) || 0,
    mark_price: parseFloat(fill.price) || 0,
    liquidation_price: 0,
    leverage: 1,
    unrealized_pnl: 0,
    realized_pnl: isClose ? parseFloat(fill.pnl) || 0 : 0,
    margin: 0,
    created_at: new Date(fill.created_at).toISOString(),
    updated_at: new Date(fill.created_at).toISOString(),
  };
}

const MAX_HISTORY_RETRIES = 3;
const HISTORY_RETRY_DELAY = 2_000;

export function usePositions(
  walletAddress: string | null,
  _signPayload: unknown = null,
  pollInterval: number = 15_000,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(async () => {});
  const hasFetchedHistory = useRef(false);
  const historyRetryCount = useRef(0);

  const fetchHistory = useCallback(async (wallet: string) => {
    const { setClosedPositions, setHistoryError } = usePositionsStore.getState();

    try {
      const pacificaRes = await fetch(
        `/api/trades/history?account=${encodeURIComponent(wallet)}&limit=100`,
      );

      if (pacificaRes.ok) {
        const pacificaJson = await pacificaRes.json();
        const fills: PacificaTradeFill[] = pacificaJson.data ?? [];
        const closeFills = fills.filter(
          (f) => f.side === "close_long" || f.side === "close_short",
        );
        if (closeFills.length > 0) {
          setClosedPositions(closeFills.map(mapFillToClosedPosition));
          setHistoryError(null);
          hasFetchedHistory.current = true;
          historyRetryCount.current = 0;
          return;
        }
      }

      const dbRes = await fetch(
        `/api/profile/trades?wallet=${encodeURIComponent(wallet)}`,
      );
      if (dbRes.ok) {
        const dbJson = await dbRes.json();
        if (dbJson.dbUnavailable) {
          setHistoryError("Trade history temporarily unavailable");
        } else {
          setHistoryError(null);
        }
        const mapped = (dbJson.trades ?? []).map(
          (t: { id: string; symbol: string; direction: string; leverage: number; size: number; entryPrice: number; exitPrice: number; pnlUsdc: number; closedAt: string }) => ({
            position_id: t.id,
            symbol: t.symbol,
            side: t.direction as "long" | "short",
            size: t.size,
            entry_price: t.entryPrice,
            mark_price: t.exitPrice,
            liquidation_price: 0,
            leverage: t.leverage,
            unrealized_pnl: 0,
            realized_pnl: t.pnlUsdc,
            margin: 0,
            created_at: t.closedAt,
            updated_at: t.closedAt,
          }),
        );
        setClosedPositions(mapped);
        hasFetchedHistory.current = true;
        historyRetryCount.current = 0;
      } else {
        throw new Error("Both Pacifica and DB history failed");
      }
    } catch {
      if (historyRetryCount.current < MAX_HISTORY_RETRIES) {
        historyRetryCount.current++;
        setTimeout(() => fetchHistory(wallet), HISTORY_RETRY_DELAY);
      } else {
        setHistoryError("Failed to load trade history after multiple attempts");
      }
    }
  }, []);

  useEffect(() => {
    fetchRef.current = async () => {
      if (!walletAddress) return;

      const { setPositions, setOpenOrders, setError } =
        usePositionsStore.getState();
      try {
        const [posRes, ordersRes] = await Promise.all([
          fetch(`/api/positions?walletAddress=${encodeURIComponent(walletAddress)}`),
          fetch(`/api/orders?account=${encodeURIComponent(walletAddress)}`),
        ]);

        if (!posRes.ok) {
          const json = await posRes.json();
          throw new Error(json.error || `Positions failed: ${posRes.status}`);
        }
        const posJson = await posRes.json();
        setPositions(posJson.positions || []);

        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          setOpenOrders(ordersJson.orders || []);
        }

        if (!hasFetchedHistory.current) {
          fetchHistory(walletAddress);
        }

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch positions",
        );
      }
    };

    if (!walletAddress) return;

    usePositionsStore.getState().setLoading(true);
    fetchRef.current().finally(() => {
      usePositionsStore.getState().setLoading(false);
    });

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchRef.current(), pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [walletAddress, pollInterval, fetchHistory]);

  return {
    refetch: () => fetchRef.current(),
    refetchHistory: () => {
      if (walletAddress) {
        hasFetchedHistory.current = false;
        historyRetryCount.current = 0;
        fetchHistory(walletAddress);
      }
    },
  };
}
