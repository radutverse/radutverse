import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "hash_required" },
        { status: 400 },
      );
    }

    // TODO: Implement remix hash whitelist storage
    return NextResponse.json({
      ok: true,
      message: "Hash added to whitelist",
    });
  } catch (error: any) {
    console.error("[Add Remix Hash] Error:", error);
    return NextResponse.json(
      { ok: false, error: "add_hash_failed" },
      { status: 500 },
    );
  }
}
