import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { market_id, side, size, walletAddress, signature } = body;
    if (!market_id || !side || !size) {
      return NextResponse.json(
        { error: "Missing required fields: market_id, side, size" },
        { status: 400 }
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }

    // Close = market order in opposite direction with reduce_only
    const closeSide = side === "long" ? "sell" : "buy";

    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        market_id,
        side: closeSide,
        type: "market",
        size,
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
