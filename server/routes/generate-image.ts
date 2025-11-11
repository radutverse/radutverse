import { RequestHandler } from "express";
import FormData from "form-data";
import { Readable } from "stream";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const generateImage: RequestHandler = async (req, res) => {
  try {
    const { prompt, image } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured on the server");
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    let imageUrl: string;

    if (image && image.data) {
      // Image editing mode using DALL-E 2 inpainting
      imageUrl = await editImageWithDallE2(image.data, image.mimeType, prompt);
    } else {
      // Text to image generation using DALL-E 3
      imageUrl = await generateImageWithDallE3(prompt);
    }

    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({
        error: "Failed to download generated image",
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString("base64");
    const mimeType = "image/png";

    res.json({
      data: base64Data,
      mimeType: mimeType,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      error: "An error occurred while generating the image",
    });
  }
};

async function generateImageWithDallE3(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
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
        quality: "standard",
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenAI DALL-E 3 error:", error);
    throw new Error(error.error?.message || "Image generation failed");
  }

  const data = (await response.json()) as any;
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }

  return imageUrl;
}

async function editImageWithDallE2(
  base64Data: string,
  _mimeType: string,
  prompt: string,
): Promise<string> {
  const imageBuffer = Buffer.from(base64Data, "base64");

  const formData = new FormData();
  formData.append("image", Readable.from(imageBuffer), "image.png");
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData as any,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenAI DALL-E 2 inpainting error:", error);
    throw new Error(error.error?.message || "Image editing failed");
  }

  const data = (await response.json()) as any;
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }

  return imageUrl;
}
