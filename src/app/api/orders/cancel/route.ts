import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { order_id, symbol, walletAddress, signature, timestamp, expiry_window } = body;

    if (!order_id || !symbol || !walletAddress || !signature || !timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: order_id, symbol, walletAddress, signature, timestamp, expiry_window" },
        { status: 400 },
      );
    }

    const { cancelOrder } = await import("@/lib/pacifica");
    await cancelOrder(order_id, symbol, {
      walletAddress,
      signature,
      timestamp,
      expiry_window,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
