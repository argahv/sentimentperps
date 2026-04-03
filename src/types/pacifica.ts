// Pacifica API Types
// Docs: https://docs.pacifica.fi/api-documentation/api
// REST: https://api.pacifica.fi/api/v1 (prod) | https://test-api.pacifica.fi/api/v1 (testnet)
// WS: wss://ws.pacifica.fi/ws (prod) | wss://test-ws.pacifica.fi/ws (testnet)

// ─── Raw API response types (match actual Pacifica endpoints) ───────────────

/** Raw market from GET /api/v1/info */
export interface PacificaInfoMarket {
  symbol: string;
  tick_size: string;
  lot_size: string;
  max_leverage: number;
  isolated_only: boolean;
  min_order_size: string;
  max_order_size: string;
  funding_rate: string;
  next_funding_rate: string;
  created_at: number;
}

/** Wrapper for GET /api/v1/info response */
export interface PacificaInfoResponse {
  success: boolean;
  data: PacificaInfoMarket[];
}

/** Raw price entry from GET /api/v1/info/prices */
export interface PacificaPriceEntry {
  symbol: string;
  mark: string;
  mid: string;
  oracle: string;
  funding: string;
  open_interest: string;
  volume_24h: string;
  next_funding: string;
  timestamp: number;
  yesterday_price: string;
}

/** Wrapper for GET /api/v1/info/prices response */
export interface PacificaPricesResponse {
  success: boolean;
  data: PacificaPriceEntry[];
}

// ─── Normalized app-level market type (used by store & UI) ──────────────────

export interface PacificaMarket {
  symbol: string;
  tick_size: number;
  lot_size: number;
  max_leverage: number;
  isolated_only: boolean;
  min_order_size: number;
  max_order_size: number;
  funding_rate: number;
  next_funding_rate: number;
  created_at: number;
  // Price fields — populated from /info/prices when available
  mark_price: number;
  mid_price: number;
  oracle_price: number;
  open_interest: number;
}

export interface PacificaMarketsResponse {
  markets: PacificaMarket[];
}

// ─── Order types ────────────────────────────────────────────────────────────

/** Pacifica uses bid/ask, not buy/sell */
export type PacificaOrderSide = "bid" | "ask";

/** App-level direction used in UI */
export type OrderSide = "buy" | "sell";

export type OrderType = "market" | "limit" | "stop_market" | "stop_limit";
export type TimeInForce = "GTC" | "IOC" | "ALO" | "TOB";
export type OrderStatus =
  | "open"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "rejected";
export type PositionSide = "long" | "short";

/** Request body for POST /api/v1/orders/create (limit) — matches Pacifica exactly */
export interface PacificaOrderRequest {
  symbol: string;
  side: PacificaOrderSide;
  price: string;
  amount: string;
  tif: TimeInForce;
  reduce_only: boolean;
  leverage?: number;
  builder_code?: string;
  max_builder_fee_rate?: number;
}

/** Request body for POST /api/v1/orders/create_market — matches Pacifica exactly */
export interface PacificaMarketOrderRequest {
  symbol: string;
  side: PacificaOrderSide;
  amount: string;
  slippage_percent: string;
  reduce_only: boolean;
  leverage?: number;
  builder_code?: string;
  max_builder_fee_rate?: number;
}

export interface PacificaOrder {
  order_id: string;
  symbol: string;
  side: PacificaOrderSide;
  type: string;
  amount: string;
  price: string;
  filled_amount: string;
  average_fill_price: string;
  status: OrderStatus;
  leverage: number;
  created_at: string;
  updated_at: string;
}

export interface PacificaPosition {
  position_id: string;
  symbol: string;
  side: PositionSide;
  size: number;
  entry_price: number;
  mark_price: number;
  liquidation_price: number;
  leverage: number;
  unrealized_pnl: number;
  realized_pnl: number;
  margin: number;
  created_at: string;
  updated_at: string;
}

export interface PacificaPositionsResponse {
  positions: PacificaPosition[];
}

export interface PacificaOrdersResponse {
  orders: PacificaOrder[];
}

export interface PacificaAuthPayload {
  timestamp: number;
  expiry_window: number;
  [key: string]: unknown;
}

export interface PacificaWSMessage {
  type: string;
  channel: string;
  data: unknown;
}

export interface PacificaWSSubscribe {
  type: "subscribe";
  channel: string;
  params?: Record<string, unknown>;
}

export interface PacificaTicker {
  symbol: string;
  last_price: number;
  mark_price: number;
  index_price: number;
  funding_rate: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_pct_24h: number;
  high_24h: number;
  low_24h: number;
  open_interest: number;
}

export interface PacificaBuilderInfo {
  builder_code: string;
  fee_rate: number;
  total_volume: number;
  total_fees_earned: number;
}

/** Request body for POST /api/v1/positions/tpsl */
export interface PacificaTpSlRequest {
  symbol: string;
  take_profit?: string;
  stop_loss?: string;
}
