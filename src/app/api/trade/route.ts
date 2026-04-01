import { NextResponse } from "next/server";
import type { PacificaOrderSide, TimeInForce } from "@/types/pacifica";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { symbol, side, size, walletAddress, signature } = body;
    if (!symbol || !side || !size) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, size" },
        { status: 400 }
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }

    const pacificaSide: PacificaOrderSide = side === "buy" ? "bid" : "ask";
    const tif: TimeInForce = body.time_in_force ?? "GTC";
    const isMarket = !body.price;
    const price = isMarket ? "0" : String(body.price);
    const amount = String(size);

    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        symbol,
        side: pacificaSide,
        price,
        amount,
        tif,
        reduce_only: body.reduce_only ?? false,
        leverage: body.leverage,
      },
      { walletAddress, signature }
    );

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Trade execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
