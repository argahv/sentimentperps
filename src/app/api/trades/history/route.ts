import { NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/pacifica";

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

    const result = await getTradeHistory(account, {
      symbol: searchParams.get("symbol") ?? undefined,
      start_time: searchParams.get("start_time")
        ? Number(searchParams.get("start_time"))
        : undefined,
      end_time: searchParams.get("end_time")
        ? Number(searchParams.get("end_time"))
        : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trade history";
    console.error("[trades/history] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
