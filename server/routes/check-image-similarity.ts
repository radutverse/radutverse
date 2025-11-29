import type { RequestHandler } from "express";

export const handleCheckImageSimilarity: RequestHandler = async (
  req,
  res
) => {
  try {
    const { imageBase64_1, imageBase64_2 } = req.body;

    if (!imageBase64_1 || !imageBase64_2) {
      return res.status(400).json({
        ok: false,
        error: "Missing imageBase64_1 or imageBase64_2",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return res.status(503).json({
        ok: false,
        error: "Vision service not configured",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Compare these two images and provide a similarity score (0-100) and brief explanation of similarities/differences.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64_1}`,
                },
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64_2}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      return res.status(response.status).json({
        ok: false,
        error: "Failed to compare images",
      });
    }

    const data = (await response.json()) as any;
    const analysisText = data.choices?.[0]?.message?.content || "";

    res.json({
      ok: true,
      analysis: analysisText,
      similarityScore: 0,
    });
  } catch (error) {
    console.error("Image similarity check error:", error);
    res.status(500).json({
      ok: false,
      error: "Internal server error during similarity check",
    });
  }
};
