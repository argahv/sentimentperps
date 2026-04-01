import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { market_id, side, type, size, walletAddress, signature, authPayload } = body;
    if (!market_id || !side || !type || !size) {
      return NextResponse.json(
        { error: "Missing required fields: market_id, side, type, size" },
        { status: 400 }
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }

    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        market_id,
        side,
        type,
        size,
        price: body.price,
        stop_price: body.stop_price,
        leverage: body.leverage,
        reduce_only: body.reduce_only,
        time_in_force: body.time_in_force,
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
