"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePositionsStore } from "@/stores/positions";

export function usePositions(
  walletAddress: string | null,
  signature: string | null,
  pollInterval: number = 15_000
) {
  const { setPositions, setLoading, setError } = usePositionsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!walletAddress || !signature) return;

    try {
      const params = new URLSearchParams({ walletAddress, signature });
      const res = await fetch(`/api/positions?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      const data = await res.json();
      setPositions(data.positions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
    }
  }, [walletAddress, signature, setPositions, setError]);

  useEffect(() => {
    if (!walletAddress || !signature) return;

    setLoading(true);
    fetchPositions().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchPositions, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [walletAddress, signature, pollInterval, fetchPositions, setLoading]);

  return { refetch: fetchPositions };
}
