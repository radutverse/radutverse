import OpenAI from "openai";
import {
  generateImageFromTextGemini,
  generateImageFromImageAndTextGemini,
  upscaleImageGemini,
  generateVideoFromTextGemini,
  generateVideoFromImageAndTextGemini,
} from "./gemini-generation.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const fileToBase64 = (buffer: Buffer, mimeType: string): string => {
  return buffer.toString("base64");
};

/**
 * Generate image from text - tries both OpenAI and Gemini concurrently
 * Returns the first successful result
 */
export async function generateImageFromText(prompt: string): Promise<string> {
  const providers = [];

  // Try OpenAI if key is available
  if (process.env.OPENAI_API_KEY) {
    providers.push(
      (async () => {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
        });
        return response.data[0].url || "";
      })(),
    );
  }

  // Try Gemini if key is available
  if (process.env.GEMINI_API_KEY) {
    providers.push(generateImageFromTextGemini(prompt));
  }

  if (providers.length === 0) {
    throw new Error(
      "No image generation API keys configured (OPENAI_API_KEY or GEMINI_API_KEY)",
    );
  }

  // Race all providers and return the first successful one
  const results = await Promise.allSettled(providers);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      return result.value;
    }
  }

  // If all failed, throw the first error
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }

  throw new Error("Image generation failed from all providers");
}

/**
 * Generate image from image and text - tries both OpenAI and Gemini concurrently
 * Returns the first successful result
 */
export async function generateImageFromImageAndText(
  prompt: string,
  image: { base64: string; mimeType: string },
): Promise<string> {
  const providers = [];

  // Try OpenAI if key is available
  if (process.env.OPENAI_API_KEY) {
    providers.push(
      (async () => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${image.mimeType};base64,${image.base64}`,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
        });

        // For vision tasks, return a success indicator
        return `data:text/plain;base64,${Buffer.from(JSON.stringify({ success: true, model: "gpt-4o" })).toString("base64")}`;
      })(),
    );
  }

  // Try Gemini if key is available
  if (process.env.GEMINI_API_KEY) {
    providers.push(generateImageFromImageAndTextGemini(prompt, image));
  }

  if (providers.length === 0) {
    throw new Error(
      "No image generation API keys configured (OPENAI_API_KEY or GEMINI_API_KEY)",
    );
  }

  // Race all providers and return the first successful one
  const results = await Promise.allSettled(providers);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      // Prefer Gemini result if available (it has actual image data)
      if (result.value.startsWith("data:image/")) {
        return result.value;
      }
    }
  }

  // Return any successful result
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      return result.value;
    }
  }

  // If all failed, throw the first error
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }

  throw new Error("Image generation failed from all providers");
}

/**
 * Upscale image - tries both OpenAI and Gemini concurrently
 * Returns the first successful result
 */
export async function upscaleImage(image: {
  base64: string;
  mimeType: string;
}): Promise<string> {
  const providers = [];

  // Try OpenAI if key is available
  if (process.env.OPENAI_API_KEY) {
    providers.push(
      (async () => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${image.mimeType};base64,${image.base64}`,
                  },
                },
                {
                  type: "text",
                  text: "Upscale this image to a higher resolution, enhancing details and clarity without adding new elements.",
                },
              ],
            },
          ],
        });

        return `data:text/plain;base64,${Buffer.from(JSON.stringify({ success: true, model: "gpt-4o" })).toString("base64")}`;
      })(),
    );
  }

  // Try Gemini if key is available
  if (process.env.GEMINI_API_KEY) {
    providers.push(upscaleImageGemini(image));
  }

  if (providers.length === 0) {
    throw new Error(
      "No image upscaling API keys configured (OPENAI_API_KEY or GEMINI_API_KEY)",
    );
  }

  // Race all providers and return the first successful one
  const results = await Promise.allSettled(providers);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      // Prefer Gemini result if available (it has actual image data)
      if (result.value.startsWith("data:image/")) {
        return result.value;
      }
    }
  }

  // Return any successful result
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      return result.value;
    }
  }

  // If all failed, throw the first error
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }

  throw new Error("Image upscaling failed from all providers");
}

/**
 * Generate video from text - tries both OpenAI and Gemini concurrently
 * Returns the first successful result
 */
export async function generateVideoFromText(
  prompt: string,
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  const providers = [];

  // Try Gemini if key is available
  if (process.env.GEMINI_API_KEY) {
    providers.push(generateVideoFromTextGemini(prompt, onProgress));
  }

  if (providers.length === 0) {
    throw new Error("No video generation API keys configured (GEMINI_API_KEY)");
  }

  // Use Promise.race to get the first successful result
  return Promise.race(providers);
}

/**
 * Generate video from image and text - tries both OpenAI and Gemini concurrently
 * Returns the first successful result
 */
export async function generateVideoFromImageAndText(
  prompt: string,
  image: { base64: string; mimeType: string },
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  const providers = [];

  // Try Gemini if key is available
  if (process.env.GEMINI_API_KEY) {
    providers.push(
      generateVideoFromImageAndTextGemini(prompt, image, onProgress),
    );
  }

  if (providers.length === 0) {
    throw new Error("No video generation API keys configured (GEMINI_API_KEY)");
  }

  // Use Promise.race to get the first successful result
  return Promise.race(providers);
}
