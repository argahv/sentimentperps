"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFuulAffiliateStats,
  getFuulPointsLeaderboard,
  getFuulReferredUsersLeaderboard,
  getFuulClaimCheckTotals,
  getFuulClaimableChecks,
  getFuulClaimChecks,
  closeFuulClaimChecks,
  getFuulPointsMovements,
  getFuulStatsBreakdown,
} from "@/lib/fuul";
import type {
  GetAffiliateStatsResponse,
  LeaderboardResponse,
  PointsLeaderboard,
  ReferredUsersLeaderboard,
  GetClaimCheckTotalsResponse,
  GetAffiliateStatsBreakdownResponse,
  UserPointsMovementsResponse,
} from "@/lib/fuul";
import type { CloseClaimChecksResponse, GetClaimableChecksResponse } from "@/lib/fuul";
import type { GroupByPeriod, DateRangePreset } from "@/lib/fuul";

interface FuulStatsState {
  data: GetAffiliateStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useFuulStats(walletAddress: string | null) {
  const [state, setState] = useState<FuulStatsState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getFuulAffiliateStats(walletAddress);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch Fuul stats",
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

interface FuulLeaderboardState {
  data: LeaderboardResponse<PointsLeaderboard> | null;
  loading: boolean;
  error: string | null;
}

export function useFuulLeaderboard(page = 1, pageSize = 10) {
  const [state, setState] = useState<FuulLeaderboardState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getFuulPointsLeaderboard(page, pageSize);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch leaderboard",
      });
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

interface FuulReferredUsersLeaderboardState {
  data: LeaderboardResponse<ReferredUsersLeaderboard> | null;
  loading: boolean;
  error: string | null;
}

export function useFuulReferredUsersLeaderboard(page = 1, pageSize = 10) {
  const [state, setState] = useState<FuulReferredUsersLeaderboardState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getFuulReferredUsersLeaderboard(page, pageSize);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch referred users leaderboard",
      });
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

interface FuulClaimsState {
  totals: GetClaimCheckTotalsResponse | null;
  claimable: GetClaimableChecksResponse | null;
  loading: boolean;
  error: string | null;
  claiming: boolean;
  claimResult: CloseClaimChecksResponse | null;
  claimError: string | null;
}

export function useFuulClaims(walletAddress: string | null) {
  const [state, setState] = useState<FuulClaimsState>({
    totals: null,
    claimable: null,
    loading: false,
    error: null,
    claiming: false,
    claimResult: null,
    claimError: null,
  });

  const fetchClaims = useCallback(async () => {
    if (!walletAddress) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [totals, claimable] = await Promise.all([
        getFuulClaimCheckTotals(walletAddress),
        getFuulClaimableChecks(walletAddress),
      ]);
      setState((prev) => ({
        ...prev,
        totals,
        claimable,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch claim data",
      }));
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const claimAll = useCallback(async () => {
    if (!walletAddress) return;
    setState((prev) => ({ ...prev, claiming: true, claimError: null, claimResult: null }));
    try {
      const openChecks = await getFuulClaimChecks(walletAddress, "open");
      if (!openChecks?.claim_checks?.length) {
        setState((prev) => ({
          ...prev,
          claiming: false,
          claimError: "No open claim checks found",
        }));
        return;
      }

      const ids = openChecks.claim_checks.map((check) => check.id);
      const result = await closeFuulClaimChecks(walletAddress, ids);
      setState((prev) => ({
        ...prev,
        claiming: false,
        claimResult: result,
        claimError: result ? null : "Failed to close claim checks",
      }));
      await fetchClaims();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        claiming: false,
        claimError: err instanceof Error ? err.message : "Failed to claim rewards",
      }));
    }
  }, [walletAddress, fetchClaims]);

  return { ...state, refetch: fetchClaims, claimAll };
}

interface FuulActivityState {
  data: UserPointsMovementsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useFuulActivity(walletAddress: string | null, page = 1, pageSize = 20) {
  const [state, setState] = useState<FuulActivityState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getFuulPointsMovements(walletAddress, page, pageSize);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch activity",
      });
    }
  }, [walletAddress, page, pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

interface FuulEarningsBreakdownState {
  data: GetAffiliateStatsBreakdownResponse | null;
  loading: boolean;
  error: string | null;
}

export function useFuulEarningsBreakdown(
  walletAddress: string | null,
  groupBy: GroupByPeriod = "day",
  dateRange: DateRangePreset = "30d",
) {
  const [state, setState] = useState<FuulEarningsBreakdownState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getFuulStatsBreakdown(walletAddress, groupBy, dateRange);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch earnings breakdown",
      });
    }
  }, [walletAddress, groupBy, dateRange]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
