import {
  generateImageFromTextGemini,
  generateImageFromImageAndTextGemini,
  upscaleImageGemini,
  generateVideoFromTextGemini,
  generateVideoFromImageAndTextGemini,
} from "./gemini-generation.js";

export const fileToBase64 = (buffer: Buffer, mimeType: string): string => {
  return buffer.toString("base64");
};

/**
 * Generate image from text using Gemini
 */
export async function generateImageFromText(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return generateImageFromTextGemini(prompt);
}

/**
 * Generate image from image and text using Gemini
 */
export async function generateImageFromImageAndText(
  prompt: string,
  image: { base64: string; mimeType: string },
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return generateImageFromImageAndTextGemini(prompt, image);
}

/**
 * Upscale image using Gemini
 */
export async function upscaleImage(image: {
  base64: string;
  mimeType: string;
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return upscaleImageGemini(image);
}

/**
 * Generate video from text using Gemini
 */
export async function generateVideoFromText(
  prompt: string,
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return generateVideoFromTextGemini(prompt, onProgress);
}

/**
 * Generate video from image and text using Gemini
 */
export async function generateVideoFromImageAndText(
  prompt: string,
  image: { base64: string; mimeType: string },
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return generateVideoFromImageAndTextGemini(prompt, image, onProgress);
}
