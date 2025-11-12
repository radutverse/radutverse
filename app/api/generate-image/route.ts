import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt text" },
        { status: 400 },
      );
    }

    const result = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
    });

    if (!result.data || !result.data[0]) {
      console.error("❌ Unexpected OpenAI response:", result);
      return NextResponse.json(
        { error: "No image data received" },
        { status: 500 },
      );
    }

    let imageUrl: string;

    if (result.data[0].url) {
      imageUrl = result.data[0].url;
    } else if (result.data[0].b64_json) {
      imageUrl = `data:image/png;base64,${result.data[0].b64_json}`;
    } else {
      console.error("❌ Unexpected OpenAI response format:", result.data[0]);
      return NextResponse.json(
        { error: "No URL or base64 found in response" },
        { status: 500 },
      );
    }

    console.log("✅ Image generated successfully");
    return NextResponse.json({ url: imageUrl });
  } catch (err: any) {
    console.error("❌ Error generating image:", err);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: err.message || String(err),
      },
      { status: 500 },
    );
  }
}
