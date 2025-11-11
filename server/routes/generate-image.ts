import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Gunakan direktori tmp bawaan Vercel
const TMP_DIR = "/tmp";

// Pastikan direktori ada
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// 🔹 1️⃣ TEXT → IMAGE
export const generateImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("❌ Error generating image:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 2️⃣ IMAGE + PROMPT → AI EDIT (pakai referenced_image_ids biar hasil beda)
export const editImage: RequestHandler = async (req, res) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt?.trim();

    if (!file) return res.status(400).json({ error: "Missing image file" });
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    // ✅ simpan di /tmp agar bisa ditulis di Vercel
    const tmpPath = path.join(TMP_DIR, `${uuidv4()}.png`);
    await sharp(file.buffer).png().toFile(tmpPath);

    // Upload gambar ke OpenAI → dapat image_id
    const uploaded = await openai.files.create({
      file: fs.createReadStream(tmpPath),
      purpose: "vision",
    });

    // Generate image baru berdasarkan referensi lama + prompt baru
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      referenced_image_ids: [uploaded.id],
    });

    const imageUrl = response.data[0].url;

    // Bersihkan file sementara
    fs.unlinkSync(tmpPath);
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("❌ Error editing image:", error);
    res.status(500).json({ error: error.message });
  }
};
