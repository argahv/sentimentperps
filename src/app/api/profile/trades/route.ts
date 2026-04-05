import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required parameter: wallet" },
        { status: 400 },
      );
    }

    const limit = Math.min(
      Number(searchParams.get("limit")) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const cursor = searchParams.get("cursor") ?? undefined;

    const trades = await prisma.trade.findMany({
      where: { walletAddress: wallet },
      orderBy: { closedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const hasMore = trades.length > limit;
    const results = hasMore ? trades.slice(0, limit) : trades;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return NextResponse.json({
      trades: results,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trades";
    console.error("[profile/trades] GET error:", message);

    const isDbConnectionError =
      message.includes("localhost") ||
      message.includes("5432") ||
      message.includes("ECONNREFUSED") ||
      message.includes("Can't reach") ||
      message.includes("connect");

    if (isDbConnectionError) {
      return NextResponse.json(
        { trades: [], hasMore: false, nextCursor: null, dbUnavailable: true },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
