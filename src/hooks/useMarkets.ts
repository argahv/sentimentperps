"use client";

import { useEffect, useRef } from "react";
import { useMarketsStore } from "@/stores/markets";

const MARKETS_API = "/api/markets";
const POLL_INTERVAL = 60_000;

export function useMarkets() {
  const setMarkets = useMarketsStore((s) => s.setMarkets);
  const setLoading = useMarketsStore((s) => s.setLoading);
  const markets = useMarketsStore((s) => s.markets);
  const isLoading = useMarketsStore((s) => s.isLoading);
  const fetchedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function fetchMarkets() {
      try {
        if (!fetchedRef.current) setLoading(true);
        const res = await fetch(MARKETS_API);
        if (!res.ok) throw new Error(`Markets fetch failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setMarkets(data.markets ?? []);
          fetchedRef.current = true;
        }
      } catch (err) {
        console.error("[useMarkets]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMarkets();
    timer = setInterval(fetchMarkets, POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [setMarkets, setLoading]);

  return { markets, isLoading };
}
