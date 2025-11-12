import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement admin remix hash management
  return NextResponse.json({
    ok: true,
    hashes: [],
  });
}

export async function POST() {
  // TODO: Implement clear remix hashes
  return NextResponse.json({
    ok: true,
    message: "Remix hashes cleared",
  });
}
