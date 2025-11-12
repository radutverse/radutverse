import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer, parseFormData } from "@/lib/api/file-upload";

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const file = files.image;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "no_file", message: "No image file provided" },
        { status: 400 },
      );
    }

    // TODO: Implement full image upload and analysis
    // For now, return placeholder response
    return NextResponse.json({
      ok: true,
      message: "File received",
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { ok: false, error: "upload_failed" },
      { status: 500 },
    );
  }
}
