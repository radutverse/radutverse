import { RequestHandler } from "express";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const generateImage: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body;

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
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI Image Generation error:", error);
      return res.status(response.status).json({
        error: error.error?.message || "Image generation failed",
      });
    }

    const data = (await response.json()) as any;
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: "No image URL returned from OpenAI",
      });
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
