// Pacifica API Client
// Docs: https://docs.pacifica.fi/api-documentation/api
// Auth: Ed25519 signature on recursively-sorted JSON payload

import type {
  PacificaInfoResponse,
  PacificaPricesResponse,
  PacificaInfoMarket,
  PacificaPriceEntry,
  PacificaMarket,
  PacificaMarketsResponse,
  PacificaOrderRequest,
  PacificaOrder,
  PacificaPositionsResponse,
  PacificaOrdersResponse,
  PacificaAuthPayload,
} from "@/types/pacifica";

const PACIFICA_BASE_URL =
  process.env.PACIFICA_API_URL ??
  (process.env.NEXT_PUBLIC_PACIFICA_ENV === "mainnet"
    ? "https://api.pacifica.fi/api/v1"
    : "https://test-api.pacifica.fi/api/v1");

export const BUILDER_CODE = "SENTPERPS";
export const DEFAULT_BUILDER_FEE_RATE = 0.0005;

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

function normalizeMarket(
  raw: PacificaInfoMarket,
  price?: PacificaPriceEntry
): PacificaMarket {
  return {
    symbol: raw.symbol,
    tick_size: Number(raw.tick_size),
    lot_size: Number(raw.lot_size),
    max_leverage: raw.max_leverage,
    isolated_only: raw.isolated_only,
    min_order_size: Number(raw.min_order_size),
    max_order_size: Number(raw.max_order_size),
    funding_rate: Number(raw.funding_rate),
    next_funding_rate: Number(raw.next_funding_rate),
    created_at: raw.created_at,
    mark_price: price ? Number(price.mark) : 0,
    mid_price: price ? Number(price.mid) : 0,
    oracle_price: price ? Number(price.oracle) : 0,
    open_interest: price ? Number(price.open_interest) : 0,
  };
}

export async function getMarkets(): Promise<PacificaMarketsResponse> {
  const [infoRes, pricesRes] = await Promise.all([
    fetch(`${PACIFICA_BASE_URL}/info`, { next: { revalidate: 30 } }),
    fetch(`${PACIFICA_BASE_URL}/info/prices`, { next: { revalidate: 10 } }).catch(
      () => null
    ),
  ]);

  if (!infoRes.ok) throw new Error(`Pacifica /info failed: ${infoRes.status}`);

  const info: PacificaInfoResponse = await infoRes.json();
  if (!info.success || !Array.isArray(info.data)) {
    throw new Error("Pacifica /info returned unexpected shape");
  }

  let priceMap = new Map<string, PacificaPriceEntry>();
  if (pricesRes?.ok) {
    const prices: PacificaPricesResponse = await pricesRes.json();
    if (prices.success && Array.isArray(prices.data)) {
      priceMap = new Map(prices.data.map((p) => [p.symbol, p]));
    }
  }

  const markets = info.data.map((raw) =>
    normalizeMarket(raw, priceMap.get(raw.symbol))
  );

  return { markets };
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
    account: auth.walletAddress,
    signature: auth.signature,
    timestamp: Date.now(),
    builder_code: order.builder_code || BUILDER_CODE,
    max_builder_fee_rate:
      order.max_builder_fee_rate || DEFAULT_BUILDER_FEE_RATE,
  };

  const res = await fetch(`${PACIFICA_BASE_URL}/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
