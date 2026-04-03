import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const signature = searchParams.get("signature");
    const timestamp = searchParams.get("timestamp");
    const expiry_window = searchParams.get("expiry_window");
    const type = searchParams.get("type") || "get_positions";

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }

    if (!timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing signature fields: timestamp, expiry_window" },
        { status: 400 }
      );
    }

    const { getPositions } = await import("@/lib/pacifica");
    const data = await getPositions({
      walletAddress,
      signature,
      timestamp: parseInt(timestamp, 10),
      expiry_window: parseInt(expiry_window, 10),
      type,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch positions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
