"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface RecentWin {
  id: string;
  symbol: string;
  direction: string;
  leverage: number;
  pnlUsdc: number;
  pnlPct: number;
  sentimentScore: number;
  closedAt: string;
  trader: string;
}

interface UseRecentWinsReturn {
  wins: RecentWin[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Polls GET /api/dashboard/recent-wins at a configurable interval.
 * Pauses polling when the tab is hidden to save resources.
 * Exposes `refetch` for immediate re-fetch after a qualifying trade close.
 */
export function useRecentWins(pollIntervalMs: number = 20_000): UseRecentWinsReturn {
  const [wins, setWins] = useState<RecentWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const fetchWins = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/recent-wins");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      if (isMountedRef.current) {
        setWins(data.wins ?? []);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch recent wins");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    fetchWins();

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchWins, pollIntervalMs);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchWins();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchWins, pollIntervalMs]);

  return { wins, isLoading, error, refetch: fetchWins };
}
