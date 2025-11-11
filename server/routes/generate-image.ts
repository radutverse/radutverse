import { RequestHandler } from "express";

export const handleGenerateImage: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({
        error: "Missing or invalid prompt",
        success: false,
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      res.status(500).json({
        error: "Image generation not configured",
        success: false,
      });
      return;
    }

    // Call Google Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            outputMimeType: "image/jpeg",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      res.status(response.status).json({
        error:
          errorData.error?.message || "Failed to generate image",
        success: false,
      });
      return;
    }

    const data = await response.json();

    // Extract image data from response
    if (!data.predictions || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      res.status(500).json({
        error: "No images generated",
        success: false,
      });
      return;
    }

    const imageData = data.predictions[0];
    const base64Image = imageData.bytesBase64Encoded || imageData.bytes;

    if (!base64Image) {
      res.status(500).json({
        error: "Invalid response format",
        success: false,
      });
      return;
    }

    res.json({
      success: true,
      image: `data:image/jpeg;base64,${base64Image}`,
      prompt: prompt,
    });
  } catch (error) {
    console.error("Generate image error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
  }
};
