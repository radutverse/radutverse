import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const editImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    const file = req.file;

    if (!file || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt" });
    }

    let buffer = file.buffer;

    // 🔹 Deteksi format image
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (e) {
      console.error("⚠️ Failed to read image metadata:", e);
      return res
        .status(400)
        .json({ error: "Failed to process image. Make sure it's a valid image." });
    }

    // 🔹 Resize & re-encode untuk mencegah array too long
    buffer = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .jpeg({ quality: 90 }) // compress
      .toBuffer();

    console.log("📸 Image resized & re-encoded, bytes:", buffer.length);

    // 🔹 Kirim ke OpenAI
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: buffer, // buffer sudah aman
    });

    res.json({ editedImageUrl: response.data[0].url });
  } catch (err: any) {
    console.error("❌ Error editing image:", err);
    res.status(500).json({
      error: "Failed to edit image",
      details: err.message || err,
    });
  }
};
