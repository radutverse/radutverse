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

    // 🔧 Pastikan MIME type valid
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    let mimeType = file.mimetype;

    // Jika entah kenapa terdeteksi sebagai application/octet-stream
    if (!validTypes.includes(mimeType)) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        if (metadata.format === "jpeg") mimeType = "image/jpeg";
        else if (metadata.format === "png") mimeType = "image/png";
        else if (metadata.format === "webp") mimeType = "image/webp";
        else throw new Error(`Unsupported detected format: ${metadata.format}`);
      } catch (e) {
        console.error("⚠️ Failed to detect real mimetype:", e);
        return res.status(400).json({
          error:
            "Unsupported image type. Please upload a valid JPEG, PNG, or WEBP.",
        });
      }
    }

    console.log("📸 Uploaded file type:", mimeType);

    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: [
        {
          name: file.originalname,
          buffer: file.buffer,
          mimeType, // ✅ pakai hasil MIME fix di atas
        },
      ],
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
