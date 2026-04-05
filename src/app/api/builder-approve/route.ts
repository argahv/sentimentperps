import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { builder_code, walletAddress, signature, timestamp, expiry_window } = body;

    if (!builder_code || !walletAddress || !signature || !timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: builder_code, walletAddress, signature, timestamp, expiry_window" },
        { status: 400 },
      );
    }

    const { approveBuilderCode } = await import("@/lib/pacifica");
    await approveBuilderCode(builder_code, {
      walletAddress,
      signature,
      timestamp,
      expiry_window,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve builder code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
