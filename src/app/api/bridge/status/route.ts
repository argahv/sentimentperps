import { NextResponse } from "next/server";
import { getBridgeStatus } from "@/lib/rhino";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get("quoteId");

    if (!quoteId) {
      return NextResponse.json(
        { error: "Missing required query parameter: quoteId" },
        { status: 400 }
      );
    }

    const status = await getBridgeStatus(quoteId);
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bridge status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
