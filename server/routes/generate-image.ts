import { RequestHandler } from "express";
import sharp from "sharp";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 TEXT → IMAGE (generate dari teks bebas)
export const generateImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt text" });
    }

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured on the server");
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    const result = await openai_generate_image(prompt);

    res.json({ url: result });
  } catch (error: any) {
    console.error("❌ Error generating image:", error);
    res.status(500).json({
      error: "Failed to generate image",
      details: error.message,
    });
  }
};

// 🖌️ IMAGE �� IMAGE (edit gambar + prompt)
export const editImage: RequestHandler = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer || !prompt) {
      return res.status(400).json({
        error: "Missing image file or prompt text",
      });
    }

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured on the server");
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    const result = await openai_edit_image(imageBuffer, prompt);

    res.json({ url: result });
  } catch (error: any) {
    console.error("❌ Error editing image:", error);
    res.status(500).json({
      error: "Failed to edit image",
      details: error.message,
    });
  }
};

async function openai_generate_image(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenAI DALL-E error:", error);
    throw new Error(error.error?.message || "Image generation failed");
  }

  const data = (await response.json()) as any;
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }

  return imageUrl;
}

async function openai_edit_image(
  imageBuffer: Buffer,
  prompt: string,
): Promise<string> {
  const MAX_FILE_SIZE = 4 * 1024 * 1024;

  if (imageBuffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Image file is too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum 4MB allowed.`,
    );
  }

  let pngBuffer: Buffer;

  try {
    pngBuffer = await sharp(imageBuffer)
      .grayscale()
      .png()
      .toBuffer();

    if (pngBuffer.length > MAX_FILE_SIZE) {
      pngBuffer = await sharp(imageBuffer)
        .grayscale()
        .resize(1024, 1024, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    }

    if (pngBuffer.length > MAX_FILE_SIZE) {
      pngBuffer = await sharp(imageBuffer)
        .grayscale()
        .resize(800, 800, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    }
  } catch (error: any) {
    throw new Error(`Failed to process image: ${error.message}`);
  }

  const formData = new FormData();

  formData.append(
    "image",
    new Blob([pngBuffer], { type: "image/png" }),
    "image.png",
  );
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenAI image edit error:", error);
    throw new Error(error.error?.message || "Image editing failed");
  }

  const data = (await response.json()) as any;
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }

  return imageUrl;
}
