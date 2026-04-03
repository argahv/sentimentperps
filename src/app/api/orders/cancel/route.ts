import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { orderId, walletAddress, signature, timestamp, expiry_window } = body;

    if (!orderId || !walletAddress || !signature || !timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, walletAddress, signature, timestamp, expiry_window" },
        { status: 400 },
      );
    }

    const { cancelOrder } = await import("@/lib/pacifica");
    await cancelOrder(orderId, {
      walletAddress,
      signature,
      timestamp,
      expiry_window,
      type: "cancel_order",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
