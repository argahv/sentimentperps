import { NextResponse } from "next/server";
import { getOrderHistory } from "@/lib/pacifica";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");

    if (!account) {
      return NextResponse.json(
        { error: "Missing required parameter: account" },
        { status: 400 },
      );
    }

    const result = await getOrderHistory(account, {
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch order history";
    console.error("[orders/history] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
