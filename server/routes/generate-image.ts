import { RequestHandler } from "express";
import OpenAI from "openai";
import sharp from "sharp";
import { FormData, Blob } from "formdata-node";
import fetch from "node-fetch"; // Node <18

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

    // 🔹 Resize & re-encode untuk aman (must be under 16384 bytes for OpenAI)
    let buffer = await sharp(file.buffer)
      .resize({ width: 256, height: 256, fit: "inside" })
      .jpeg({ quality: 70 })
      .toBuffer();

    console.log("📸 Image resized & re-encoded, bytes:", buffer.length);

    // 🔹 Further compress if still too large
    if (buffer.length > 16384) {
      buffer = await sharp(file.buffer)
        .resize({ width: 256, height: 256, fit: "inside" })
        .jpeg({ quality: 50 })
        .toBuffer();
      console.log("📸 Re-compressed image, bytes:", buffer.length);
    }

    if (buffer.length > 16384) {
      return res.status(400).json({
        error:
          "Image too large. Please use a smaller or lower resolution image.",
        currentSize: buffer.length,
        maxSize: 16384,
      });
    }

    // 🔹 Gunakan FormData untuk kirim ke OpenAI
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append(
      "image",
      new File([buffer], "image.jpg", { type: "image/jpeg" }),
    );

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: form as any, // FormData type untuk node-fetch
    });

    const data = await response.json();
    res.json({ editedImageUrl: data.data[0].url });
  } catch (err: any) {
    console.error("❌ Error editing image:", err);
    res.status(500).json({
      error: "Failed to edit image",
      details: err.message || err,
    });
  }
};
