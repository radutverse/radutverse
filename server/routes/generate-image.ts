import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import sharp from "sharp";
import { RequestHandler } from "express";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const editImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    const file = req.file;
    if (!file || !prompt) return res.status(400).json({ error: "Missing image or prompt" });

    // Deteksi format asli
    const metadata = await sharp(file.buffer).metadata();
    let ext: string;
    if (metadata.format === "jpeg") ext = "jpg";
    else if (metadata.format === "png") ext = "png";
    else if (metadata.format === "webp") ext = "webp";
    else throw new Error("Unsupported image format");

    // Simpan sementara
    const tmpPath = path.join(tmpdir(), `tmp-${Date.now()}.${ext}`);
    await sharp(file.buffer).toFile(tmpPath);

    // Kirim ke OpenAI
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: fs.createReadStream(tmpPath), // ✅ gunakan ReadStream
    });

    fs.unlinkSync(tmpPath); // hapus file sementara
    res.json({ editedImageUrl: response.data[0].url });
  } catch (err: any) {
    console.error("❌ Error editing image:", err);
    res.status(500).json({ error: "Failed to edit image", details: err.message });
  }
};
