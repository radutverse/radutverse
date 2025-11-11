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

    // 🔹 Valid image formats
    const validFormats = ["jpeg", "png", "webp"];
    let buffer = file.buffer;

    // 🔹 Deteksi format menggunakan sharp
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (e) {
      console.error("⚠️ Failed to read image metadata:", e);
      return res
        .status(400)
        .json({ error: "Failed to process image. Make sure it is a valid image." });
    }

    let format = metadata.format;
    if (!format || !validFormats.includes(format)) {
      // 🔹 Re-encode ke PNG jika format tidak didukung
      console.log(`⚠️ Re-encoding from ${format} → png`);
      buffer = await sharp(buffer).png().toBuffer();
      format = "png";
    }

    console.log("📸 Using image format:", format);

    // 🔹 Kirim ke OpenAI (buffer langsung, tanpa name/mimeType)
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: buffer,
    });

    const editedImageUrl = response.data[0].url;
    res.json({ editedImageUrl });
  } catch (err: any) {
    console.error("❌ Error editing image:", err);
    res.status(500).json({
      error: "Failed to edit image",
      details: err.message || err,
    });
  }
};
