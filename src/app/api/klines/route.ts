import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SOL").toUpperCase();
  const interval = searchParams.get("interval") ?? "15m";
  const days = Number(searchParams.get("days") ?? "7");

  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  try {
    const { getKlines } = await import("@/lib/pacifica");
    const klines = await getKlines(symbol, interval, startTime, endTime);

    const candles = klines.map((k) => ({
      time: k.t,
      open: Number(k.o),
      high: Number(k.h),
      low: Number(k.l),
      close: Number(k.c),
    }));

    return NextResponse.json({ candles, symbol });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch kline data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
