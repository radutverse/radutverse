import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

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

// 🔹 2️⃣ IMAGE + PROMPT → AI EDIT (pakai referenced_image_ids biar berubah nyata)
export const editImage: RequestHandler = async (req, res) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt?.trim();

    if (!file) return res.status(400).json({ error: "Missing image file" });
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    const tmpPath = path.join(TMP_DIR, `${uuidv4()}.png`);
    await sharp(file.buffer).png().toFile(tmpPath);

    // Upload gambar dulu → dapatkan image_id untuk reference
    const uploaded = await openai.files.create({
      file: fs.createReadStream(tmpPath),
      purpose: "vision",
    });

    // Gunakan gpt-image-1 + referenced_image_ids agar hasil berubah drastis
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      referenced_image_ids: [uploaded.id],
    });

    const imageUrl = response.data[0].url;

    fs.unlinkSync(tmpPath);
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("❌ Error editing image:", error);
    res.status(500).json({ error: error.message });
  }
};
