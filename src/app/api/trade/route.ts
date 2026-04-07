import { NextResponse } from "next/server";
import { sendFuulServerEvent } from "@/lib/fuul-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { symbol, side, amount, walletAddress, signature, timestamp, expiry_window, isMarket } = body;
    if (!symbol || !side || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, amount" },
        { status: 400 }
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }
    if (!timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: timestamp, expiry_window" },
        { status: 400 }
      );
    }

    if (isMarket) {
      const auth = { walletAddress, signature, timestamp, expiry_window };
      const { createMarketOrder } = await import("@/lib/pacifica");
      const order = await createMarketOrder(
        {
          symbol,
          side,
          amount: String(amount),
          slippage_percent: body.slippage_percent ?? "0.5",
          reduce_only: body.reduce_only ?? false,
          take_profit: body.take_profit,
          stop_loss: body.stop_loss,
        },
        auth
      );
      // Server-side Fuul conversion event (non-blocking — must not break trade flow)
      if (!body.reduce_only) {
        sendFuulServerEvent({
          eventName: "trade_open",
          walletAddress,
          volumeUsdc: Number(amount),
          metadata: { symbol, side },
        });
      }
      return NextResponse.json({ order });
    }

    const auth = { walletAddress, signature, timestamp, expiry_window };
    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        symbol,
        side,
        price: body.price,
        amount: String(amount),
        tif: body.tif ?? "GTC",
        reduce_only: body.reduce_only ?? false,
        take_profit: body.take_profit,
        stop_loss: body.stop_loss,
      },
      auth
    );
    // Server-side Fuul conversion event (non-blocking — must not break trade flow)
    if (!body.reduce_only) {
      sendFuulServerEvent({
        eventName: "trade_open",
        walletAddress,
        volumeUsdc: Number(amount),
        metadata: { symbol, side },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Trade execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
