import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/pacifica";

const VALID_RANGES = ["1d", "7d", "14d", "30d", "all"] as const;
type TimeRange = (typeof VALID_RANGES)[number];

function isValidRange(v: string): v is TimeRange {
  return (VALID_RANGES as readonly string[]).includes(v);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");

    if (!account) {
      return NextResponse.json(
        { error: "Missing required parameter: account" },
        { status: 400 },
      );
    }

    const rangeParam = searchParams.get("time_range") ?? "30d";
    const timeRange: TimeRange = isValidRange(rangeParam) ? rangeParam : "30d";

    const result = await getPortfolio(account, timeRange);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch portfolio";
    console.error("[portfolio] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
