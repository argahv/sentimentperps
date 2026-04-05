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
  take_profit?: PacificaTpSlLevel;
  stop_loss?: PacificaTpSlLevel;
}

/** Request body for POST /api/v1/orders/create_market — matches Pacifica exactly */
export interface PacificaMarketOrderRequest {
  symbol: string;
  side: PacificaOrderSide;
  amount: string;
  slippage_percent: string;
  reduce_only: boolean;
  leverage?: number;
  take_profit?: PacificaTpSlLevel;
  stop_loss?: PacificaTpSlLevel;
}

export interface PacificaOrder {
  order_id: string;
  client_order_id?: string;
  symbol: string;
  side: PacificaOrderSide;
  order_type: string;
  price: string;
  initial_amount: string;
  filled_amount: string;
  cancelled_amount: string;
  stop_price?: string;
  stop_parent_order_id?: string;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
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

/** TP/SL price level — Pacifica requires an object, not a flat string */
export interface PacificaTpSlLevel {
  stop_price: string;
  limit_price?: string;
  client_order_id?: string;
}

/** Request body for POST /api/v1/positions/tpsl */
export interface PacificaTpSlRequest {
  symbol: string;
  side: PacificaOrderSide;
  take_profit?: PacificaTpSlLevel;
  stop_loss?: PacificaTpSlLevel;
}

// ─── History / Analytics types ──────────────────────────────────────────────

/** A single fill from GET /api/v1/trades/history */
export interface PacificaTradeFill {
  history_id: number;
  order_id: number;
  client_order_id: string;
  symbol: string;
  amount: string;
  price: string;
  entry_price: string;
  fee: string;
  pnl: string;
  event_type: "fulfill_taker" | "fulfill_maker";
  side: "open_long" | "open_short" | "close_long" | "close_short";
  created_at: number;
  cause: "normal" | "market_liquidation" | "backstop_liquidation" | "settlement";
}

export interface PacificaTradeHistoryResponse {
  success: boolean;
  data: PacificaTradeFill[];
  next_cursor: string;
  has_more: boolean;
}

/** A historical order from GET /api/v1/orders/history */
export interface PacificaHistoricalOrder {
  order_id: number;
  client_order_id: string;
  symbol: string;
  side: PacificaOrderSide;
  initial_price: string;
  average_filled_price: string;
  amount: string;
  filled_amount: string;
  order_status: "open" | "partially_filled" | "filled" | "cancelled" | "rejected";
  order_type: string;
  stop_price: string | null;
  reduce_only: boolean;
  reason: "cancel" | "force_cancel" | "expired" | "post_only_rejected" | "self_trade_prevented" | null;
  created_at: number;
  updated_at: number;
}

export interface PacificaOrderHistoryResponse {
  success: boolean;
  data: PacificaHistoricalOrder[];
  next_cursor: string;
  has_more: boolean;
}

/** A funding payment from GET /api/v1/funding/history */
export interface PacificaFundingPayment {
  history_id: number;
  symbol: string;
  side: PacificaOrderSide;
  amount: string;
  payout: string;
  rate: string;
  created_at: number;
}

export interface PacificaFundingHistoryResponse {
  success: boolean;
  data: PacificaFundingPayment[];
  next_cursor: string;
  has_more: boolean;
}

/** A portfolio equity snapshot from GET /api/v1/portfolio */
export interface PacificaPortfolioSnapshot {
  account_equity: string;
  pnl: string;
  timestamp: number;
}

export interface PacificaPortfolioResponse {
  success: boolean;
  data: PacificaPortfolioSnapshot[];
}
