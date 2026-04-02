import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RecordTradeBody {
  walletAddress: string;
  symbol: string;
  direction: "long" | "short";
  leverage: number;
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnlUsdc: number;
  pnlPct: number;
  sentimentScoreAtEntry?: number;
  minutesAfterSignal?: number;
  sentimentAligned?: boolean;
  closedAt?: string;
}

export async function POST(request: Request) {
  try {
    const body: RecordTradeBody = await request.json();

    const {
      walletAddress,
      symbol,
      direction,
      leverage,
      size,
      entryPrice,
      exitPrice,
      pnlUsdc,
      pnlPct,
    } = body;

    if (!walletAddress || !symbol || !direction || !size || !entryPrice || !exitPrice) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, symbol, direction, size, entryPrice, exitPrice" },
        { status: 400 }
      );
    }

    if (typeof pnlUsdc !== "number" || typeof pnlPct !== "number") {
      return NextResponse.json(
        { error: "pnlUsdc and pnlPct must be numbers" },
        { status: 400 }
      );
    }

    const minutesAfterSignal = body.minutesAfterSignal ?? 5;
    const sentimentAligned = body.sentimentAligned ?? true;

    // score = pnlPct * (1 / minutesAfterSignal), only for profitable trades
    const score =
      minutesAfterSignal > 0 && pnlPct > 0
        ? Math.round(pnlPct * (1 / minutesAfterSignal) * 100) / 100
        : 0;

    const trade = await prisma.trade.create({
      data: {
        walletAddress,
        symbol,
        direction,
        leverage: leverage ?? 1,
        size,
        entryPrice,
        exitPrice,
        pnlUsdc,
        pnlPct,
        sentimentScoreAtEntry: body.sentimentScoreAtEntry ?? 0,
        minutesAfterSignal,
        sentimentAligned,
        score,
        closedAt: body.closedAt ? new Date(body.closedAt) : new Date(),
      },
    });

    return NextResponse.json({ trade: { id: trade.id, score: trade.score } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record trade";
    console.error("[record-trade] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
