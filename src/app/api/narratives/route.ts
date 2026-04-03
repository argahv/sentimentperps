import { NextResponse } from "next/server";
import type { ElfaNarrative, ElfaTrendingNarrativesResponse } from "@/types/elfa";

const MOCK_NARRATIVES: ElfaNarrative[] = [
  {
    title: "Layer 2 Scaling Solutions Gaining Momentum",
    summary:
      "Ethereum L2s are seeing record transaction volumes as gas costs hit yearly lows. Arbitrum and Base are leading adoption with DeFi TVL surging.",
    sentiment: "positive",
    confidence: 0.87,
    tokens: ["ETH", "ARB", "OP", "BASE"],
    mention_count: 4821,
    source_count: 312,
    time_period: "24h",
  },
  {
    title: "Bitcoin ETF Outflows Spark Short-Term Uncertainty",
    summary:
      "Institutional BTC ETF products recorded net outflows for the third consecutive day, raising concerns about near-term price support levels.",
    sentiment: "negative",
    confidence: 0.74,
    tokens: ["BTC"],
    mention_count: 7203,
    source_count: 489,
    time_period: "24h",
  },
  {
    title: "Solana DeFi Ecosystem Expansion",
    summary:
      "New protocol launches on Solana are attracting liquidity from Ethereum-native traders. DEX volumes on Solana hit a 6-month high this week.",
    sentiment: "positive",
    confidence: 0.81,
    tokens: ["SOL", "JUP", "RAY"],
    mention_count: 3190,
    source_count: 228,
    time_period: "24h",
  },
  {
    title: "Regulatory Clarity Still Awaited in Key Markets",
    summary:
      "Crypto markets are in a holding pattern ahead of upcoming regulatory decisions in the EU and US. Traders are cautious but not bearish.",
    sentiment: "neutral",
    confidence: 0.69,
    tokens: ["BTC", "ETH", "SOL"],
    mention_count: 2540,
    source_count: 187,
    time_period: "24h",
  },
];

export async function GET() {
  try {
    const res = await fetch(
      "https://api.elfa.ai/v2/data/trending-narratives",
      {
        headers: { "x-elfa-api-key": process.env.ELFA_API_KEY ?? "" },
        next: { revalidate: 180 },
      }
    );

    if (res.ok) {
      const json: ElfaTrendingNarrativesResponse = await res.json();
      const narratives = json?.data?.narratives;
      if (Array.isArray(narratives) && narratives.length > 0) {
        return NextResponse.json({ narratives });
      }
    }

    return NextResponse.json({ narratives: MOCK_NARRATIVES });
  } catch {
    return NextResponse.json({ narratives: MOCK_NARRATIVES });
  }
}
