import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const WATERMARK_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F7585065ca91c47d49c4941a9d86c1824%2F2e193049610d4654908bb1a59b6187a7?format=webp&width=800";

async function fetchImageBuffer(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("❌ Error fetching image:", error);
    throw error;
  }
}

export const generateImageWithWatermark: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    if (!result.data || !result.data[0]) {
      console.error("❌ Unexpected OpenAI response:", result);
      return res.status(500).json({ error: "No image data received" });
    }

    let generatedImageBuffer: Buffer;

    if (result.data[0].url) {
      console.log("📥 Downloading generated image from URL");
      generatedImageBuffer = await fetchImageBuffer(result.data[0].url);
    } else if (result.data[0].b64_json) {
      console.log("📥 Using base64 image data");
      generatedImageBuffer = Buffer.from(result.data[0].b64_json, "base64");
    } else {
      console.error("❌ Unexpected OpenAI response format:", result.data[0]);
      return res
        .status(500)
        .json({ error: "No URL or base64 found in response" });
    }

    console.log("📥 Downloading watermark image");
    const watermarkBuffer = await fetchImageBuffer(WATERMARK_URL);

    console.log("🎨 Applying watermark using sharp");
    const generatedImage = sharp(generatedImageBuffer);
    const metadata = await generatedImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to determine image dimensions");
    }

    const watermarkedBuffer = await generatedImage
      .composite([
        {
          input: watermarkBuffer,
          top: 0,
          left: 0,
          tile: true,
        },
      ])
      .png()
      .toBuffer();

    console.log("✅ Watermark applied successfully");

    res.set("Content-Type", "image/png");
    res.send(watermarkedBuffer);
  } catch (err: any) {
    console.error("❌ Error generating watermarked image:", err);
    res.status(500).json({
      error: "Failed to generate watermarked image",
      details: err.message || String(err),
    });
  }
};
