import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateAndPersist } from "@/lib/badges";
import { sendFuulServerEvent } from "@/lib/fuul-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      symbol,
      side,
      amount,
      walletAddress,
      signature,
      timestamp,
      expiry_window,
      positionMeta,
    } = body;
    if (!symbol || !side || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, amount" },
        { status: 400 },
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 },
      );
    }
    if (!timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: timestamp, expiry_window" },
        { status: 400 },
      );
    }

    const { createMarketOrder } = await import("@/lib/pacifica");
    const order = await createMarketOrder(
      {
        symbol,
        side,
        amount: String(amount),
        slippage_percent: body.slippage_percent ?? "0.5",
        reduce_only: true,
      },
      {
        walletAddress,
        signature,
        timestamp,
        expiry_window,
      },
    );

    if (positionMeta) {
      const { entryPrice, markPrice, leverage, pnlUsdc, direction } = positionMeta;
      const pnlPct =
        entryPrice > 0
          ? ((markPrice - entryPrice) / entryPrice) * 100 *
            (direction === "long" ? 1 : -1)
          : 0;

      const minutesAfterSignal = positionMeta.minutesAfterSignal ?? 5;
      const sentimentAligned = positionMeta.sentimentAligned ?? true;
      const score =
        minutesAfterSignal > 0 && pnlPct > 0
          ? Math.round(pnlPct * (1 / minutesAfterSignal) * 100) / 100
          : 0;

      try {
        await prisma.trade.create({
          data: {
            walletAddress,
            symbol,
            direction: direction ?? (side === "ask" ? "long" : "short"),
            leverage: leverage ?? 1,
            size: Number(amount),
            entryPrice,
            exitPrice: markPrice,
            pnlUsdc: pnlUsdc ?? 0,
            pnlPct,
            sentimentScoreAtEntry: positionMeta.sentimentScoreAtEntry ?? 0,
            minutesAfterSignal,
            sentimentAligned,
            score,
            closedAt: new Date(),
          },
        });

        try {
          const gamification = await evaluateAndPersist(walletAddress, score);
          if (gamification.badges.length > 0 || gamification.xpGained > 0) {
            console.log(
              `[positions/close] Gamification: wallet=${walletAddress} badges=[${gamification.badges.join(",")}] xp=+${gamification.xpGained} score=${score}`
            );
          }
        } catch (evalErr) {
          console.error("[positions/close] evaluateAndPersist failed:", evalErr);
        }
      } catch (dbErr) {
        console.error("[positions/close] DB persist failed (non-blocking):", dbErr);
      }
    }

    // Server-side Fuul conversion event (non-blocking)
    sendFuulServerEvent({
      eventName: "trade_close",
      walletAddress,
      volumeUsdc: Number(amount),
      metadata: {
        symbol,
        side,
        ...(positionMeta?.pnlUsdc !== undefined && { pnl_usd: positionMeta.pnlUsdc }),
        ...(positionMeta?.direction && { direction: positionMeta.direction }),
        ...(positionMeta?.leverage && { leverage: positionMeta.leverage }),
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to close position";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
