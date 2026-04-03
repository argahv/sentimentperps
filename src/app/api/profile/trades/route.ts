import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required parameter: wallet" },
        { status: 400 }
      );
    }

    const trades = await prisma.trade.findMany({
      where: { walletAddress: wallet },
      orderBy: { closedAt: "desc" },
      take: 50,
      select: {
        id: true,
        symbol: true,
        direction: true,
        leverage: true,
        size: true,
        entryPrice: true,
        exitPrice: true,
        pnlUsdc: true,
        pnlPct: true,
        sentimentAligned: true,
        minutesAfterSignal: true,
        score: true,
        closedAt: true,
      },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch trades";
    console.error("[profile/trades] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
