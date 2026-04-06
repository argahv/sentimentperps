import {
  UserIdentifierType,
  type LeaderboardResponse,
  type ListUserReferralCodesResponse,
  type GetClaimCheckTotalsResponse,
  type ClaimCheckTotalItem,
  type GetClaimableChecksResponse,
  type CloseClaimChecksResponse,
  type GetClaimChecksResponse,
  type ClaimCheckItem,
  type GetAffiliateStatsResponse,
  type GetAffiliateStatsBreakdownResponse,
  type StatsBreakdownResult,
  type GroupByPeriod,
  type DateRangePreset,
} from "@fuul/sdk";

// Types not re-exported from @fuul/sdk main entry — defined locally to match SDK shapes
export interface PointsLeaderboard {
  address: string;
  affiliate_code?: string;
  total_amount: number;
  rank: number;
  total_attributions: number;
  tiers?: Record<string, string>;
  referred_volume?: number;
  enduser_revenue?: number;
  referred_users?: number;
  enduser_volume?: number;
}

export interface ReferredUsersLeaderboard {
  address: string;
  total_referred_users: number;
  rank: number;
}

export interface UserPointsMovement {
  date: string;
  is_referrer: boolean;
  conversion_id: string;
  conversion_name: string;
  total_amount: string;
  project_name: string;
  payout_status: string;
  payout_status_details: string | null;
}

export interface UserPointsMovementsResponse {
  total_results: number;
  page: number;
  page_size: number;
  results: UserPointsMovement[];
}

let initialized = false;

export async function initFuul(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    const apiKey = process.env.NEXT_PUBLIC_FUUL_API_KEY;
    if (!apiKey) {
      console.warn("[Fuul] NEXT_PUBLIC_FUUL_API_KEY not set — skipping init");
      return;
    }
    Fuul.init({ apiKey });
    initialized = true;
  } catch (err) {
    console.warn("[Fuul] Init failed:", err);
  }
}

export async function sendPageview(pageName?: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    await Fuul.sendPageview(pageName);
  } catch (err) {
    console.warn("[Fuul] sendPageview failed:", err);
  }
}

export async function identifyUser(walletAddress: string): Promise<void> {
  if (typeof window === "undefined" || !walletAddress) return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    await Fuul.identifyUser({
      identifier: walletAddress,
      identifierType: UserIdentifierType.SolanaAddress,
    });
  } catch (err) {
    console.warn("[Fuul] identifyUser failed:", err);
  }
}

/**
 * Send a conversion event to Fuul for trade attribution.
 * This is the CRITICAL link that connects trades to referral rewards.
 * Called client-side after successful trade open or position close.
 */
export async function sendFuulConversionEvent(params: {
  walletAddress: string;
  symbol: string;
  direction: string;
  sizeUsdc: number;
  leverage: number;
  eventType: "trade_open" | "trade_close";
  pnlUsdc?: number;
  orderId?: string;
}): Promise<void> {
  if (typeof window === "undefined" || !params.walletAddress) return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    await Fuul.sendEvent(params.eventType, {
      user_address: params.walletAddress,
      symbol: params.symbol,
      direction: params.direction,
      volume_usd: params.sizeUsdc,
      leverage: params.leverage,
      ...(params.pnlUsdc !== undefined && { pnl_usd: params.pnlUsdc }),
      ...(params.orderId && { order_id: params.orderId }),
    });
  } catch (err) {
    // Non-blocking: conversion tracking failure must NOT break the trade flow
    console.warn("[Fuul] sendConversionEvent failed:", err);
  }
}

export async function generateTrackingLink(
  affiliateAddress: string,
): Promise<string | null> {
  if (typeof window === "undefined" || !affiliateAddress) return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    const baseUrl = window.location.origin;
    const link = await Fuul.generateTrackingLink(
      baseUrl,
      affiliateAddress,
      UserIdentifierType.SolanaAddress,
    );
    return link;
  } catch (err) {
    console.warn("[Fuul] generateTrackingLink failed:", err);
    return null;
  }
}

export async function getFuulAffiliateStats(
  walletAddress: string,
): Promise<GetAffiliateStatsResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getAffiliateStats({ user_identifier: walletAddress });
  } catch (err) {
    console.warn("[Fuul] getAffiliateStats failed:", err);
    return null;
  }
}

export async function getFuulPointsLeaderboard(
  page = 1,
  pageSize = 10,
): Promise<LeaderboardResponse<PointsLeaderboard> | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getPointsLeaderboard({ page, page_size: pageSize });
  } catch (err) {
    console.warn("[Fuul] getPointsLeaderboard failed:", err);
    return null;
  }
}

export async function getFuulReferredUsersLeaderboard(
  page = 1,
  pageSize = 10,
): Promise<LeaderboardResponse<ReferredUsersLeaderboard> | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getReferredUsersLeaderboard({ page, page_size: pageSize });
  } catch (err) {
    console.warn("[Fuul] getReferredUsersLeaderboard failed:", err);
    return null;
  }
}

export async function getFuulClaimCheckTotals(
  walletAddress: string,
): Promise<GetClaimCheckTotalsResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getClaimCheckTotals({
      user_identifier: walletAddress,
      user_identifier_type: UserIdentifierType.SolanaAddress,
    });
  } catch (err) {
    console.warn("[Fuul] getClaimCheckTotals failed:", err);
    return null;
  }
}

export async function getFuulClaimableChecks(
  walletAddress: string,
): Promise<GetClaimableChecksResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getClaimableChecks({
      user_identifier: walletAddress,
      user_identifier_type: UserIdentifierType.SolanaAddress,
    });
  } catch (err) {
    console.warn("[Fuul] getClaimableChecks failed:", err);
    return null;
  }
}

export async function closeFuulClaimChecks(
  walletAddress: string,
  claimCheckIds: string[],
): Promise<CloseClaimChecksResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.closeClaimChecks({
      user_identifier: walletAddress,
      user_identifier_type: UserIdentifierType.SolanaAddress,
      claim_check_ids: claimCheckIds,
    });
  } catch (err) {
    console.warn("[Fuul] closeClaimChecks failed:", err);
    return null;
  }
}

export async function getFuulClaimChecks(
  walletAddress: string,
  status?: "open" | "unclaimed" | "claimed",
): Promise<GetClaimChecksResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    const { ClaimCheckStatus } = await import("@fuul/sdk");
    const statusMap = {
      open: ClaimCheckStatus.Open,
      unclaimed: ClaimCheckStatus.Unclaimed,
      claimed: ClaimCheckStatus.Claimed,
    };
    return await Fuul.getClaimChecks({
      user_identifier: walletAddress,
      user_identifier_type: UserIdentifierType.SolanaAddress,
      ...(status && { status: statusMap[status] }),
    });
  } catch (err) {
    console.warn("[Fuul] getClaimChecks failed:", err);
    return null;
  }
}

export async function getFuulPointsMovements(
  walletAddress: string,
  page = 1,
  pageSize = 20,
): Promise<UserPointsMovementsResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getUserPointsMovements({
      user_identifier: walletAddress,
      identifier_type: UserIdentifierType.SolanaAddress,
      page,
      page_size: pageSize,
    });
  } catch (err) {
    console.warn("[Fuul] getUserPointsMovements failed:", err);
    return null;
  }
}

export async function getFuulStatsBreakdown(
  walletAddress: string,
  groupBy: GroupByPeriod = "day",
  dateRange: DateRangePreset = "30d",
): Promise<GetAffiliateStatsBreakdownResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.getStatsBreakdown({
      user_identifier: walletAddress,
      group_by: groupBy,
      date_range: dateRange,
    });
  } catch (err) {
    console.warn("[Fuul] getStatsBreakdown failed:", err);
    return null;
  }
}

export async function getFuulUserReferralCodes(
  walletAddress: string,
  page = 1,
  pageSize = 25,
): Promise<ListUserReferralCodesResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    return await Fuul.listUserReferralCodes({
      user_identifier: walletAddress,
      user_identifier_type: UserIdentifierType.SolanaAddress,
      page,
      page_size: pageSize,
    });
  } catch (err) {
    console.warn("[Fuul] listUserReferralCodes failed:", err);
    return null;
  }
}

export type {
  GetAffiliateStatsResponse,
  LeaderboardResponse,
  GetClaimCheckTotalsResponse,
  GetClaimChecksResponse,
  GetAffiliateStatsBreakdownResponse,
  ListUserReferralCodesResponse,
  GetClaimableChecksResponse,
  CloseClaimChecksResponse,
  ClaimCheckTotalItem,
  ClaimCheckItem,
  GroupByPeriod,
  DateRangePreset,
  StatsBreakdownResult,
} from "@fuul/sdk";
