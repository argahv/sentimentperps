"use client";

import { useEffect, useRef } from "react";
import { usePositionsStore } from "@/stores/positions";

interface DbTrade {
  id: string;
  symbol: string;
  direction: string;
  leverage: number;
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnlUsdc: number;
  closedAt: string;
}

export function usePositions(
  walletAddress: string | null,
  _signPayload: unknown = null,
  pollInterval: number = 15_000,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(async () => {});
  const hasFetchedHistory = useRef(false);

  useEffect(() => {
    fetchRef.current = async () => {
      if (!walletAddress) return;

      const { setPositions, setOpenOrders, setClosedPositions, setError } =
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

        // Fetch closed trade history once on mount — history doesn't change in real-time
        if (!hasFetchedHistory.current) {
          hasFetchedHistory.current = true;
          try {
            const historyRes = await fetch(
              `/api/profile/trades?wallet=${encodeURIComponent(walletAddress)}`,
            );
            if (historyRes.ok) {
              const historyJson = await historyRes.json();
              const mapped = (historyJson.trades ?? []).map((t: DbTrade) => ({
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
              }));
              setClosedPositions(mapped);
            }
          } catch {
            // History is non-critical — swallow silently, don't surface to user
          }
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
  }, [walletAddress, pollInterval]);

  return {
    refetch: () => fetchRef.current(),
  };
}
