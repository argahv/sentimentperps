import { NextResponse } from "next/server";

const TOKEN_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ARB: "arbitrum",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SOL").toUpperCase();
  const days = searchParams.get("days") ?? "7";

  const geckoId = TOKEN_MAP[symbol];
  if (!geckoId) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko OHLC responded ${res.status}`);
    }

    const raw = (await res.json()) as number[][];

    const candles = raw.map((c) => ({
      time: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
    }));

    return NextResponse.json({ candles, symbol });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch OHLC data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
