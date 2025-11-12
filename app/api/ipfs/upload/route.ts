import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer, parseFormData } from "@/lib/api/file-upload";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

async function pinFileToPinata(name: string, buffer: Buffer, mimetype: string) {
  if (!PINATA_JWT) throw new Error("PINATA_JWT not set");
  const form = new FormData();
  const blob = new Blob([buffer], {
    type: mimetype || "application/octet-stream",
  });
  form.append("file", blob, name || "file");
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error(`pinata_file_error:${res.status}`);
  const j = (await res.json()) as any;
  const cid: string = j?.IpfsHash || j?.Hash || j?.cid;
  if (!cid) throw new Error("cid_missing");
  return cid;
}

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const file = files.file;

    if (!file) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    const buffer = await getFileBuffer(file);
    const cid = await pinFileToPinata(
      file.name || "file",
      buffer,
      file.type || "application/octet-stream"
    );

    const https = PINATA_GATEWAY
      ? `https://${PINATA_GATEWAY}/ipfs/${cid}`
      : undefined;

    return NextResponse.json({ cid, url: `ipfs://${cid}`, https });
  } catch (err) {
    console.error("ipfs upload error:", err);
    return NextResponse.json(
      { error: "ipfs_upload_failed" },
      { status: 500 }
    );
  }
}
