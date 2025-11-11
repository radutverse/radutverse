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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`;
    const requestBody = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        outputMimeType: "image/jpeg",
      },
    };

    console.log(
      "[Generate Image] Calling Gemini API with prompt:",
      prompt.substring(0, 50),
    );

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[Generate Image] API Response status:", response.status);

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn(
          "Failed to parse error response as JSON, status:",
          response.status,
        );
      }
      console.error("Gemini API error response:", {
        status: response.status,
        error: errorData,
      });
      res.status(response.status).json({
        error:
          errorData?.error?.message ||
          `API error: ${response.status} ${response.statusText}`,
        success: false,
      });
      return;
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Failed to parse response JSON:", parseError);
      res.status(500).json({
        error: "Invalid response from image generation API",
        success: false,
      });
      return;
    }

    // Extract image data from response
    if (
      !data.predictions ||
      !Array.isArray(data.predictions) ||
      data.predictions.length === 0
    ) {
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
