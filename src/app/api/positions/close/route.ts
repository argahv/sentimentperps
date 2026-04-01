import { NextResponse } from "next/server";
import type { PacificaOrderSide } from "@/types/pacifica";

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

    const closeSide: PacificaOrderSide = side === "long" ? "ask" : "bid";

    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        symbol,
        side: closeSide,
        price: "0",
        amount: String(size),
        tif: "GTC",
        reduce_only: true,
      },
      { walletAddress, signature }
    );

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to close position";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
