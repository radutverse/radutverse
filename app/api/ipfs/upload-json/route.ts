import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

async function pinJsonToPinata(json: unknown) {
  if (!PINATA_JWT) throw new Error("PINATA_JWT not set");
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: typeof json === "string" ? json : JSON.stringify(json ?? {}),
  });
  if (!res.ok) throw new Error(`pinata_json_error:${res.status}`);
  const j = (await res.json()) as any;
  const cid: string = j?.IpfsHash || j?.Hash || j?.cid;
  if (!cid) throw new Error("cid_missing");
  return cid;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body?.data ?? body;
    const cid = await pinJsonToPinata(data);

    const https = PINATA_GATEWAY
      ? `https://${PINATA_GATEWAY}/ipfs/${cid}`
      : undefined;

    return NextResponse.json({ cid, url: `ipfs://${cid}`, https });
  } catch (err) {
    console.error("ipfs json upload error:", err);
    return NextResponse.json(
      { error: "ipfs_json_upload_failed" },
      { status: 500 },
    );
  }
}
