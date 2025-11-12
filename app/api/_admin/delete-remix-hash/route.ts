import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement delete remix hash
    return NextResponse.json({
      ok: true,
      message: "Hash deleted",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "delete_failed" },
      { status: 500 }
    );
  }
}
