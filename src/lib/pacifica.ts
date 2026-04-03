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
  PacificaMarketOrderRequest,
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

export const BUILDER_CODE =
  process.env.NEXT_PUBLIC_PACIFICA_BUILDER_CODE || "SentimentPerps";
export const DEFAULT_BUILDER_FEE_RATE = 0.01;

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
      {} as Record<string, unknown>,
    );
}

/**
 * Create the signature header (type + timestamp + expiry_window).
 * Matches Pacifica SDK: { type, timestamp, expiry_window }
 */
export function createSignatureHeader(
  type: string,
  expiryWindow: number = 60_000,
): { type: string; timestamp: number; expiry_window: number } {
  return {
    type,
    timestamp: Date.now(),
    expiry_window: expiryWindow,
  };
}

/**
 * Prepare the message to be signed by the wallet.
 * Pacifica SDK format: compact JSON of sorted { ...header, data: payload }
 * Uses JSON.stringify with no whitespace (compact separators).
 */
export function prepareSignatureMessage(
  header: { type: string; timestamp: number; expiry_window: number },
  data: Record<string, unknown> = {},
): Uint8Array {
  const message = {
    ...header,
    data,
  };
  const sorted = sortPayload(message);
  // Compact JSON — no spaces (matches Python json.dumps(separators=(",",":")))
  return new TextEncoder().encode(JSON.stringify(sorted));
}

/**
 * Prepare a message to be signed for order operations.
 * Signature is computed ONLY over the order data fields (no auth metadata).
 * This allows Pacifica to reconstruct the message for verification.
 */
export function prepareSignatureMessageForOrder(
  data: Record<string, unknown> = {},
): Uint8Array {
  const sorted = sortPayload(data);
  // Compact JSON — no spaces (matches Python json.dumps(separators=(",",":")))
  return new TextEncoder().encode(JSON.stringify(sorted));
}

/** @deprecated Use createSignatureHeader + prepareSignatureMessage(header, data) instead */
export function createAuthPayload(
  data: Record<string, unknown> = {},
  expiryWindow: number = 60000,
): PacificaAuthPayload {
  return {
    ...data,
    timestamp: Date.now(),
    expiry_window: expiryWindow,
  };
}

function normalizeMarket(
  raw: PacificaInfoMarket,
  price?: PacificaPriceEntry,
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
    fetch(`${PACIFICA_BASE_URL}/info/prices`, {
      next: { revalidate: 10 },
    }).catch(() => null),
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
    normalizeMarket(raw, priceMap.get(raw.symbol)),
  );

  return { markets };
}

interface AuthHeaders {
  walletAddress: string;
  signature: string;
  timestamp?: number;
  expiry_window?: number;
  type?: string;
}

/**
 * Build canonical auth headers for authenticated requests.
 * Includes all fields needed for signature verification.
 * Per Pacifica docs: signature is constructed over { type, timestamp, expiry_window, data }
 * So the request must include all these fields for Pacifica to verify.
 */
function authHeaders(auth: AuthHeaders): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Wallet-Address": auth.walletAddress,
    "X-Signature": auth.signature,
  };

  // Include signature metadata for verification
  if (auth.timestamp !== undefined) {
    headers["X-Signature-Timestamp"] = String(auth.timestamp);
  }
  if (auth.expiry_window !== undefined) {
    headers["X-Signature-Expiry"] = String(auth.expiry_window);
  }
  if (auth.type !== undefined) {
    headers["X-Signature-Type"] = auth.type;
  }

  return headers;
}

export async function createOrder(
  order: PacificaOrderRequest,
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<PacificaOrder> {
  const body = {
    account: auth.walletAddress,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    symbol: order.symbol,
    side: order.side,
    price: order.price,
    amount: order.amount,
    tif: order.tif,
    reduce_only: order.reduce_only,
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

export async function createMarketOrder(
  order: PacificaMarketOrderRequest,
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<PacificaOrder> {
  const body = {
    account: auth.walletAddress,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    symbol: order.symbol,
    side: order.side,
    amount: order.amount,
    slippage_percent: order.slippage_percent,
    reduce_only: order.reduce_only,
  };

  const res = await fetch(`${PACIFICA_BASE_URL}/orders/create_market`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pacifica market order failed: ${res.status} — ${err}`);
  }
  return res.json();
}

export async function getPositions(
  auth: AuthHeaders & { timestamp: number; expiry_window: number; type: string },
): Promise<PacificaPositionsResponse> {
  const res = await fetch(`${PACIFICA_BASE_URL}/positions`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica positions failed: ${res.status}`);
  return res.json();
}

export async function getOpenOrders(
  auth: AuthHeaders & { timestamp: number; expiry_window: number; type: string },
): Promise<PacificaOrdersResponse> {
  const res = await fetch(`${PACIFICA_BASE_URL}/orders?status=open`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica orders failed: ${res.status}`);
  return res.json();
}

export async function cancelOrder(
  orderId: string,
  auth: AuthHeaders & { timestamp: number; expiry_window: number; type: string },
): Promise<void> {
  const res = await fetch(`${PACIFICA_BASE_URL}/orders/${orderId}`, {
    method: "DELETE",
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`Pacifica cancel failed: ${res.status}`);
}

export async function setPositionTpSl(
  params: { symbol: string; takeProfit?: number; stopLoss?: number },
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<void> {
  const body: Record<string, unknown> = {
    account: auth.walletAddress,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    symbol: params.symbol,
  };
  if (params.takeProfit !== undefined)
    body.take_profit = String(params.takeProfit);
  if (params.stopLoss !== undefined) body.stop_loss = String(params.stopLoss);

  const res = await fetch(`${PACIFICA_BASE_URL}/positions/tpsl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pacifica TP/SL failed: ${res.status} — ${err}`);
  }
}

export interface PacificaKline {
  t: number; // open time (ms)
  T: number; // close time (ms)
  s: string; // symbol
  i: string; // interval
  o: string; // open
  c: string; // close
  h: string; // high
  l: string; // low
  v: string; // volume
  n: number; // number of trades
}

export async function getKlines(
  symbol: string,
  interval: string = "15m",
  startTime: number,
  endTime?: number,
): Promise<PacificaKline[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    start_time: String(startTime),
  });
  if (endTime) params.set("end_time", String(endTime));

  const res = await fetch(`${PACIFICA_BASE_URL}/kline?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Pacifica kline failed: ${res.status}`);
  const json = await res.json();
  // Pacifica wraps response: { success, data: [...], error, code }
  const arr = json.data ?? json;
  if (!Array.isArray(arr)) throw new Error("Unexpected kline response shape");
  return arr as PacificaKline[];
}
