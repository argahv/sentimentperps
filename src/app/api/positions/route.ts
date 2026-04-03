import { NextResponse } from "next/server";

const PACIFICA_BASE_URL =
  process.env.NEXT_PUBLIC_PACIFICA_ENV === "mainnet"
    ? "https://api.pacifica.fi/api/v1"
    : "https://test-api.pacifica.fi/api/v1";

interface RawPacificaPosition {
  symbol: string;
  side: string;
  amount: string;
  entry_price: string;
  margin: string;
  funding: string;
  isolated: boolean;
  liquidation_price: string;
  created_at: number;
  updated_at: number;
}

interface PacificaPriceEntry {
  symbol: string;
  mark: string;
}

function normalizePosition(
  raw: RawPacificaPosition,
  markPrice?: number,
) {
  const entryPrice = parseFloat(raw.entry_price) || 0;
  const amount = parseFloat(raw.amount) || 0;
  const margin = parseFloat(raw.margin) || 0;
  const liquidationPrice = parseFloat(raw.liquidation_price) || 0;
  const notional = amount * entryPrice;
  const leverage = margin > 0 && notional > 0 ? Math.round(notional / margin) : 1;
  const mark = markPrice ?? entryPrice;
  const isLong = raw.side === "bid";
  const unrealizedPnl = (mark - entryPrice) * amount * (isLong ? 1 : -1);

  return {
    position_id: `${raw.symbol}-${raw.side}-${raw.created_at}`,
    symbol: raw.symbol,
    side: isLong ? "long" : "short",
    size: amount,
    entry_price: entryPrice,
    mark_price: mark,
    liquidation_price: liquidationPrice,
    leverage,
    unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
    realized_pnl: 0,
    margin,
    created_at: new Date(raw.created_at).toISOString(),
    updated_at: new Date(raw.updated_at).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: walletAddress" },
        { status: 400 },
      );
    }

    const { getPositions } = await import("@/lib/pacifica");
    const [rawResult, pricesRes] = await Promise.all([
      getPositions(walletAddress),
      fetch(`${PACIFICA_BASE_URL}/info/prices`).catch(() => null),
    ]);

    let priceMap = new Map<string, number>();
    if (pricesRes?.ok) {
      const pricesData = await pricesRes.json() as { success: boolean; data: PacificaPriceEntry[] };
      if (pricesData.success && Array.isArray(pricesData.data)) {
        priceMap = new Map(
          pricesData.data.map((p) => [p.symbol, parseFloat(p.mark) || 0]),
        );
      }
    }

    const positions = (rawResult.positions as unknown as RawPacificaPosition[]).map(
      (pos) => normalizePosition(pos, priceMap.get(pos.symbol)),
    );

    return NextResponse.json({ positions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch positions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
