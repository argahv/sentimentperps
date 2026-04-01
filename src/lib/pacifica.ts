// Pacifica API Client
// Docs: https://docs.pacifica.fi/api-documentation/api
// Auth: Ed25519 signature on recursively-sorted JSON payload

import type {
  PacificaMarketsResponse,
  PacificaOrderRequest,
  PacificaOrder,
  PacificaPositionsResponse,
  PacificaOrdersResponse,
  PacificaAuthPayload,
} from "@/types/pacifica";

const PACIFICA_BASE_URL =
  process.env.NEXT_PUBLIC_PACIFICA_ENV === "mainnet"
    ? "https://api.pacifica.fi/api/v1"
    : "https://test-api.pacifica.fi/api/v1";

export const BUILDER_CODE = "SENTPERPS";
export const DEFAULT_BUILDER_FEE_RATE = 0.0005;

// Recursively sort object keys for deterministic signing
function sortPayload(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortPayload);
  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce(
      (sorted, key) => {
        sorted[key] = sortPayload((obj as Record<string, unknown>)[key]);
        return sorted;
      },
      {} as Record<string, unknown>
    );
}

export function createAuthPayload(
  data: Record<string, unknown> = {},
  expiryWindow: number = 60000
): PacificaAuthPayload {
  return {
    ...data,
    timestamp: Date.now(),
    expiry_window: expiryWindow,
  };
}

export function prepareSignatureMessage(
  payload: PacificaAuthPayload
): Uint8Array {
  const sorted = sortPayload(payload);
  return new TextEncoder().encode(JSON.stringify(sorted));
}

export async function getMarkets(): Promise<PacificaMarketsResponse> {
  const res = await fetch(`${PACIFICA_BASE_URL}/markets`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Pacifica markets failed: ${res.status}`);
  return res.json();
}

interface AuthHeaders {
  walletAddress: string;
  signature: string;
}

function authHeaders(auth: AuthHeaders): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Wallet-Address": auth.walletAddress,
    "X-Signature": auth.signature,
  };
}

export async function createOrder(
  order: PacificaOrderRequest,
  auth: AuthHeaders
): Promise<PacificaOrder> {
  const body = {
    ...order,
    builder_code: order.builder_code || BUILDER_CODE,
    max_builder_fee_rate:
      order.max_builder_fee_rate || DEFAULT_BUILDER_FEE_RATE,
  };

  const res = await fetch(`${PACIFICA_BASE_URL}/orders`, {
    method: "POST",
    headers: authHeaders(auth),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pacifica order failed: ${res.status} — ${err}`);
  }
  return res.json();
}

export async function getPositions(
  auth: AuthHeaders
): Promise<PacificaPositionsResponse> {
  const res = await fetch(`${PACIFICA_BASE_URL}/positions`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica positions failed: ${res.status}`);
  return res.json();
}

export async function getOpenOrders(
  auth: AuthHeaders
): Promise<PacificaOrdersResponse> {
  const res = await fetch(`${PACIFICA_BASE_URL}/orders?status=open`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica orders failed: ${res.status}`);
  return res.json();
}

export async function cancelOrder(
  orderId: string,
  auth: AuthHeaders
): Promise<void> {
  const res = await fetch(`${PACIFICA_BASE_URL}/orders/${orderId}`, {
    method: "DELETE",
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica cancel failed: ${res.status}`);
}
