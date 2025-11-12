import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement full remix hash data retrieval
  return NextResponse.json({
    ok: true,
    hashes: [],
  });
}
