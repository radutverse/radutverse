import { NextRequest, NextResponse } from "next/server";
import { parseFormData, getFileBuffer } from "@/lib/api/file-upload";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const { files, fields } = await parseFormData(request);
    const file = files.image;
    const prompt = typeof fields.prompt === 'string' ? fields.prompt : fields.prompt?.[0];

    if (!file || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    // TODO: Implement image editing with OpenAI
    // Resize image to safe dimensions
    const buffer = await getFileBuffer(file);
    const resized = await sharp(buffer)
      .resize({ width: 256, height: 256, fit: "inside" })
      .jpeg({ quality: 70 })
      .toBuffer();

    return NextResponse.json({
      ok: true,
      message: "Image processed",
      size: resized.length,
    });
  } catch (err: any) {
    console.error("❌ Error editing image:", err);
    return NextResponse.json(
      {
        error: "Failed to edit image",
        details: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
