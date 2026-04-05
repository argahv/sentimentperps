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
  expiryWindow: number = 30_000,
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

export async function createOrder(
  order: PacificaOrderRequest,
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<PacificaOrder> {
  const body = {
    account: auth.walletAddress,
    agent_wallet: null,
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
    agent_wallet: null,
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
  account: string,
): Promise<PacificaPositionsResponse> {
  const res = await fetch(
    `${PACIFICA_BASE_URL}/positions?account=${encodeURIComponent(account)}`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`Pacifica positions failed: ${res.status}`);
  const json = await res.json();
  const positions = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.positions)
      ? json.positions
      : [];
  return { positions };
}

export async function getOpenOrders(
  account: string,
): Promise<PacificaOrdersResponse> {
  const res = await fetch(
    `${PACIFICA_BASE_URL}/orders?account=${encodeURIComponent(account)}`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`Pacifica orders failed: ${res.status}`);
  const json = await res.json();
  const orders = Array.isArray(json.data) ? json.data : json.orders ?? [];
  return { orders };
}

export async function cancelOrder(
  orderId: string,
  symbol: string,
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<void> {
  const body = {
    account: auth.walletAddress,
    agent_wallet: null,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    symbol,
    order_id: orderId,
  };
  const res = await fetch(`${PACIFICA_BASE_URL}/orders/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pacifica cancel failed: ${res.status} — ${err}`);
  }
}

export async function approveBuilderCode(
  builderCode: string,
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<void> {
  const body = {
    account: auth.walletAddress,
    agent_wallet: null,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    builder_code: builderCode,
  };
  const res = await fetch(`${PACIFICA_BASE_URL}/account/builder_codes/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pacifica builder code approval failed: ${res.status} — ${err}`);
  }
}

export async function setPositionTpSl(
  params: {
    symbol: string;
    side: "bid" | "ask";
    takeProfit?: number;
    stopLoss?: number;
  },
  auth: AuthHeaders & { timestamp: number; expiry_window: number },
): Promise<void> {
  const body: Record<string, unknown> = {
    account: auth.walletAddress,
    agent_wallet: null,
    signature: auth.signature,
    timestamp: auth.timestamp,
    expiry_window: auth.expiry_window,
    symbol: params.symbol,
    side: params.side,
  };

  // Pacifica expects TP/SL as objects with stop_price (and optional limit_price)
  if (params.takeProfit !== undefined) {
    body.take_profit = { stop_price: String(params.takeProfit) };
  }
  if (params.stopLoss !== undefined) {
    body.stop_loss = { stop_price: String(params.stopLoss) };
  }

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
