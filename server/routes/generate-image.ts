import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 🔹 TEXT → IMAGE
export const generateImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) return res.status(400).json({ error: "Missing prompt text" });

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = result.data[0].url;
    res.json({ imageUrl });
  } catch (err) {
    console.error("❌ Error generating image:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
};

// 🔹 IMAGE → EDIT
export const editImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    const file = req.file;

    if (!file || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt" });
    }

    const validFormats = ["jpeg", "png", "webp"];
    let buffer = file.buffer;

    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (e) {
      console.error("⚠️ Failed to read image metadata:", e);
      return res.status(400).json({ error: "Failed to process image" });
    }

    if (!metadata.format || !validFormats.includes(metadata.format)) {
      buffer = await sharp(buffer).png().toBuffer();
    }

    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: buffer,
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
