import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧩 Pakai folder sementara Vercel (/tmp)
const TMP_DIR = "/tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// 🧠 Multer setup (memory storage + MIME fallback)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    // Fallback kalau mimetype hilang (misal: application/octet-stream)
    if (!file.mimetype || file.mimetype === "application/octet-stream") {
      file.mimetype = "image/png";
    }

    if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPG, and WEBP allowed."));
    }
  },
});

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

// 🔹 2️⃣ IMAGE + PROMPT → AI EDIT (pakai image upload langsung)
export const editImage: RequestHandler = async (req, res) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt?.trim();

    if (!file) return res.status(400).json({ error: "Missing image file" });
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    console.log("📸 Uploaded file type:", file.mimetype);

    // Simpan file sementara ke /tmp agar bisa dikirim ke OpenAI
    const tmpPath = path.join(TMP_DIR, `${uuidv4()}.png`);
    await sharp(file.buffer).toFormat("png").toFile(tmpPath);

    // Kirim request edit image
    const response = await openai.images.edit({
      model: "gpt-image-1",
      prompt,
      image: fs.createReadStream(tmpPath),
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;

    fs.unlinkSync(tmpPath); // hapus file sementara
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("❌ Error editing image:", error);
    res.status(500).json({ error: error.message });
  }
};
