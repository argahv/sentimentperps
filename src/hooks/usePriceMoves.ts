"use client";

import { useState, useEffect } from "react";

interface PriceMoveData {
  moved: number;
  direction: "up" | "down";
}

interface PriceMovesState {
  priceMoves: Record<string, PriceMoveData>;
  isLoading: boolean;
  error: string | null;
}

interface APIResponse {
  prices: Record<string, { usd: number; usd_24h_change: number }>;
}

export function usePriceMoves(): PriceMovesState {
  const [state, setState] = useState<PriceMovesState>({
    priceMoves: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchPrices() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const response = await fetch("/api/price-moves");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price moves: ${response.statusText}`);
        }
        
        const data = (await response.json()) as APIResponse;
        const parsedMoves: Record<string, PriceMoveData> = {};

        if (data && data.prices) {
          Object.entries(data.prices).forEach(([token, info]) => {
            parsedMoves[token] = {
              moved: Math.abs(info.usd_24h_change),
              direction: info.usd_24h_change >= 0 ? "up" : "down",
            };
          });
        }

        if (isMounted) {
          setState({
            priceMoves: parsedMoves,
            isLoading: false,
            error: null,
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : "Unknown error occurred",
          }));
        }
      }
    }

    fetchPrices();

    const interval = setInterval(fetchPrices, 300000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}
