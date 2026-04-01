import { NextResponse } from "next/server";

const TOKEN_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ARB: "arbitrum",
  AVAX: "avalanche-2",
};

export async function GET() {
  const ids = Object.values(TOKEN_MAP).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko responded ${res.status}`);
    }

    const raw = (await res.json()) as Record<
      string,
      { usd: number; usd_24h_change: number | null }
    >;

    const prices: Record<string, { usd: number; usd_24h_change: number }> = {};

    for (const [symbol, geckoId] of Object.entries(TOKEN_MAP)) {
      const entry = raw[geckoId];
      if (entry) {
        prices[symbol] = {
          usd: entry.usd,
          usd_24h_change: entry.usd_24h_change ?? 0,
        };
      }
    }

    return NextResponse.json({ prices });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch price data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
