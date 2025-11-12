import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer, parseFormData } from "@/lib/api/file-upload";

const IDP_DESCRIBE = new Map<
  string,
  { status: number; body: any; ts: number }
>();

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;

    if (idempotencyKey && IDP_DESCRIBE.has(idempotencyKey)) {
      const cached = IDP_DESCRIBE.get(idempotencyKey)!;
      if (Date.now() - cached.ts < 60_000) {
        return NextResponse.json(
          { ok: true, ...cached.body },
          { status: cached.status },
        );
      } else {
        IDP_DESCRIBE.delete(idempotencyKey);
      }
    }

    const { files } = await parseFormData(request);
    const file = files.image;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "no_file", message: "No image file provided" },
        { status: 400 },
      );
    }

    // TODO: Implement image analysis with OpenAI Vision API
    // For now, return placeholder response
    const responseBody = {
      title: "Placeholder Title",
      description: "Placeholder description for generated image",
      category: "unknown",
    };

    if (idempotencyKey) {
      IDP_DESCRIBE.set(idempotencyKey, {
        status: 200,
        body: responseBody,
        ts: Date.now(),
      });
    }

    return NextResponse.json({ ok: true, ...responseBody });
  } catch (error: any) {
    console.error("[Describe] Error:", error);
    return NextResponse.json(
      { ok: false, error: "description_failed" },
      { status: 500 },
    );
  }
}
