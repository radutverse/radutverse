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

    // TODO: Implement remix hash whitelist checking
    return NextResponse.json({
      ok: true,
      isWhitelisted: false,
      hash: hash,
    });
  } catch (error: any) {
    console.error("[Check Remix Hash] Error:", error);
    return NextResponse.json(
      { ok: false, error: "check_hash_failed" },
      { status: 500 },
    );
  }
}
