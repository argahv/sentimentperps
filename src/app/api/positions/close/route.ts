import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { symbol, side, amount, walletAddress, signature, timestamp, expiry_window } = body;
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
        { error: "Missing signing fields: timestamp, expiry_window" },
        { status: 400 }
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
      { walletAddress, signature, timestamp, expiry_window }
    );

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to close position";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
