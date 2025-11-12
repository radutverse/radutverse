import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/api/file-upload";

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const file = files.image;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "no_file" },
        { status: 400 }
      );
    }

    // TODO: Implement advanced image detection
    return NextResponse.json({
      ok: true,
      detections: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "detection_failed" },
      { status: 500 }
    );
  }
}
