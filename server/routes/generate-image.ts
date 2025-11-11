import { RequestHandler } from "express";

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
  const formData = new FormData();

  // Check base64 size (4MB max, base64 is ~33% larger)
  const maxBase64Size = 4 * 1024 * 1024 * 0.75; // ~3MB in base64
  if (base64Data.length > maxBase64Size) {
    throw new Error(
      `Image is too large. Maximum 4MB allowed. Current size: ${(base64Data.length / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Ensure file size is under 4MB
  if (buffer.length > 4 * 1024 * 1024) {
    throw new Error(
      `Image exceeds 4MB limit. Current size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Convert to PNG format using a proper method
  // For now, create blob with explicit PNG type
  const imageBlob = new Blob([buffer], { type: "image/png" });

  // Create form data with proper file handling
  // Using text fields instead of append for better compatibility
  const boundaryString = "----WebKitFormBoundary" + Math.random().toString(36);

  let body = `--${boundaryString}\r\nContent-Disposition: form-data; name="image"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n`;

  // Add binary data
  const binaryBody = Buffer.concat([
    Buffer.from(body),
    buffer,
    Buffer.from(
      `\r\n--${boundaryString}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n--${boundaryString}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1\r\n--${boundaryString}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024\r\n--${boundaryString}--\r\n`,
    ),
  ]);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": `multipart/form-data; boundary=${boundaryString}`,
    },
    body: binaryBody,
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
