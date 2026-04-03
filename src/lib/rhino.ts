// Rhino.fi REST API Client
// Docs: https://docs.rhino.fi/
// SDK (@rhino.fi/sdk) has peer dependency conflicts with this project's Solana stack.
// Using direct REST API calls to https://api.rhino.fi instead.

const RHINO_API_BASE = "https://api.rhino.fi";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BridgeQuoteParams {
  token: string;
  chainIn: string;
  chainOut: string;
  amount: string;
}

export interface BridgeQuoteFees {
  totalFeeUsd: number;
  bridgeFeeUsd: number;
  gasFeeUsd?: number;
}

export interface BridgeQuote {
  quoteId: string;
  payAmount: string;
  receiveAmount: string;
  fees: BridgeQuoteFees;
  estimatedTime: number; // seconds
  chainIn: string;
  chainOut: string;
  token: string;
  expiresAt?: number; // unix timestamp ms
}

export type BridgeStateType =
  | "PENDING"
  | "PENDING_CONFIRMATION"
  | "ACCEPTED"
  | "EXECUTED"
  | "CANCELLED"
  | "FAILED";

export interface BridgeStatus {
  quoteId: string;
  state: BridgeStateType;
  depositTxHash?: string;
  withdrawTxHash?: string;
  updatedAt?: string;
}

// ─── Supported chains (Rhino.fi chain identifiers) ───────────────────────────

export const SUPPORTED_SOURCE_CHAINS = [
  { id: "ETHEREUM", name: "Ethereum", icon: "eth" },
  { id: "ARBITRUM_ONE", name: "Arbitrum", icon: "arb" },
  { id: "BASE", name: "Base", icon: "base" },
  { id: "POLYGON", name: "Polygon", icon: "matic" },
] as const;

export type SupportedChainId = (typeof SUPPORTED_SOURCE_CHAINS)[number]["id"];

export const DESTINATION_CHAIN = "STARKNET" as const; // Rhino.fi routes via StarkEx to Solana-compatible output; use SOLANA if API supports
export const BRIDGE_TOKEN = "USDC" as const;

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch a public bridge quote from Rhino.fi (no auth required).
 * Uses the public quote endpoint which doesn't require user registration.
 */
export async function getPublicQuote(
  params: BridgeQuoteParams
): Promise<BridgeQuote> {
  const res = await fetch(`${RHINO_API_BASE}/bridge/quote/public`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      token: params.token,
      chainIn: params.chainIn,
      chainOut: params.chainOut,
      amount: params.amount,
      mode: "receive", // "receive" means the amount is what user wants to receive
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Rhino.fi quote failed (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();

  // Normalize response shape — Rhino.fi may return slightly different field names
  return {
    quoteId: data.quoteId ?? data.id ?? crypto.randomUUID(),
    payAmount: String(data.payAmount ?? data.amountIn ?? params.amount),
    receiveAmount: String(data.receiveAmount ?? data.amountOut ?? params.amount),
    fees: {
      totalFeeUsd: Number(data.fees?.totalFeeUsd ?? data.totalFeeUsd ?? 0),
      bridgeFeeUsd: Number(data.fees?.bridgeFeeUsd ?? data.bridgeFee ?? 0),
      gasFeeUsd: Number(data.fees?.gasFeeUsd ?? data.gasFee ?? 0),
    },
    estimatedTime: Number(data.estimatedTime ?? data.eta ?? 120),
    chainIn: data.chainIn ?? params.chainIn,
    chainOut: data.chainOut ?? params.chainOut,
    token: data.token ?? params.token,
    expiresAt: data.expiresAt
      ? Number(data.expiresAt)
      : Date.now() + 60_000, // default 60s expiry
  };
}

/**
 * Fetch the current status of a bridge transaction.
 * quoteId or txHash can be used — Rhino.fi history endpoint accepts both.
 */
export async function getBridgeStatus(quoteId: string): Promise<BridgeStatus> {
  const res = await fetch(`${RHINO_API_BASE}/history/bridge/${quoteId}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Rhino.fi status failed (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();

  return {
    quoteId: data.quoteId ?? quoteId,
    state: data.state ?? data.status ?? "PENDING",
    depositTxHash: data.depositTxHash ?? data.txHash,
    withdrawTxHash: data.withdrawTxHash,
    updatedAt: data.updatedAt,
  };
}

/**
 * Build the Rhino.fi app deep-link URL so users can complete a bridge on the Rhino.fi interface.
 * This is the honest hackathon approach: we show real quotes, then hand off execution to Rhino.fi.
 */
export function buildRhinoBridgeUrl(params: {
  token: string;
  chainIn: string;
  chainOut: string;
  amount: string;
}): string {
  const url = new URL("https://app.rhino.fi/bridge");
  url.searchParams.set("token", params.token);
  url.searchParams.set("chainIn", params.chainIn);
  url.searchParams.set("chainOut", params.chainOut);
  url.searchParams.set("amount", params.amount);
  return url.toString();
}

/**
 * Format seconds into a human-readable duration string.
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `~${mins} min${mins !== 1 ? "s" : ""}`;
}
