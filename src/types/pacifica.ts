// Pacifica API Types
// Docs: https://docs.pacifica.fi/api-documentation/api
// REST: https://api.pacifica.fi/api/v1 (prod) | https://test-api.pacifica.fi/api/v1 (testnet)
// WS: wss://ws.pacifica.fi/ws (prod) | wss://test-ws.pacifica.fi/ws (testnet)

export interface PacificaMarket {
  market_id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  status: string;
  min_order_size: number;
  tick_size: number;
  step_size: number;
  max_leverage: number;
  funding_rate: number;
  mark_price: number;
  index_price: number;
  last_price: number;
  volume_24h: number;
  open_interest: number;
}

export interface PacificaMarketsResponse {
  markets: PacificaMarket[];
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop_market" | "stop_limit";
export type OrderStatus =
  | "open"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "rejected";
export type PositionSide = "long" | "short";

export interface PacificaOrderRequest {
  market_id: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price?: number; // required for limit orders
  stop_price?: number; // required for stop orders
  leverage?: number;
  reduce_only?: boolean;
  time_in_force?: "GTC" | "IOC" | "FOK";
  builder_code?: string;
  max_builder_fee_rate?: number;
}

export interface PacificaOrder {
  order_id: string;
  market_id: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  filled_size: number;
  average_fill_price: number;
  status: OrderStatus;
  leverage: number;
  created_at: string;
  updated_at: string;
}

export interface PacificaPosition {
  position_id: string;
  market_id: string;
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
