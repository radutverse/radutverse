import { GoogleGenAI, Modality } from "@google/genai";

const VIDEO_GENERATION_MESSAGES = [
  "Warming up the creative engines...",
  "Sketching the first few frames...",
  "Consulting with the digital muse...",
  "Rendering the main sequence...",
  "Adding cinematic flair...",
  "Polishing the final cut...",
  "This is taking a bit longer than usual, but good things come to those who wait!",
  "Almost there, just applying the finishing touches...",
];

export async function generateImageFromTextGemini(
  prompt: string,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateImages({
    model: "imagen-3.0-generate-001",
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "1:1",
    },
  });

  const base64ImageBytes = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
}

export async function generateImageFromImageAndTextGemini(
  prompt: string,
  image: { base64: string; mimeType: string },
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        {
          inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }
  throw new Error("No image generated.");
}

export async function upscaleImageGemini(image: {
  base64: string;
  mimeType: string;
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        {
          inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
          },
        },
        {
          text: "Upscale this image to a higher resolution, enhancing details and clarity without adding new elements.",
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }
  throw new Error("No image generated from upscaling.");
}

export async function generateVideoFromTextGemini(
  prompt: string,
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let messageIndex = 0;
  const updateProgress = (progress: number) => {
    onProgress(
      VIDEO_GENERATION_MESSAGES[
        messageIndex % VIDEO_GENERATION_MESSAGES.length
      ],
      progress,
    );
    messageIndex++;
  };

  updateProgress(5);

  let operation = await ai.models.generateVideos({
    model: "veo-2-generate-preview",
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: "16:9",
    },
  });

  updateProgress(15);
  let elapsedTime = 0;
  const updateInterval = 8000;
  const maxWaitTime = 600000;

  while (!operation.done && elapsedTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, updateInterval));
    elapsedTime += updateInterval;
    const progressPercent = Math.min(85, 15 + (elapsedTime / maxWaitTime) * 70);
    updateProgress(progressPercent);

    try {
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    } catch (error) {
      throw error;
    }
  }

  if (elapsedTime >= maxWaitTime) {
    throw new Error("Video generation timeout after 10 minutes");
  }

  updateProgress(90);

  if (operation.error) {
    throw new Error(
      (operation.error.message as string) || "Video generation failed.",
    );
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error(
      "Video generation completed, but no download link was found.",
    );
  }

  updateProgress(95);

  const videoResponse = await fetch(
    `${downloadLink}&key=${process.env.GEMINI_API_KEY}`,
  );
  if (!videoResponse.ok) {
    throw new Error(
      `Failed to download video. Status: ${videoResponse.statusText}`,
    );
  }

  updateProgress(100);

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
}

export async function generateVideoFromImageAndTextGemini(
  prompt: string,
  image: { base64: string; mimeType: string },
  onProgress: (message: string, progress: number) => void,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let messageIndex = 0;
  const updateProgress = (progress: number) => {
    onProgress(
      VIDEO_GENERATION_MESSAGES[
        messageIndex % VIDEO_GENERATION_MESSAGES.length
      ],
      progress,
    );
    messageIndex++;
  };

  updateProgress(5);

  let operation = await ai.models.generateVideos({
    model: "veo-2-generate-preview",
    prompt: prompt,
    image: {
      imageBytes: image.base64,
      mimeType: image.mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: "16:9",
    },
  });

  updateProgress(15);

  let elapsedTime = 0;
  const updateInterval = 8000;
  const maxWaitTime = 600000;

  while (!operation.done && elapsedTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, updateInterval));
    elapsedTime += updateInterval;
    const progressPercent = Math.min(85, 15 + (elapsedTime / maxWaitTime) * 70);
    updateProgress(progressPercent);

    try {
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    } catch (error) {
      throw error;
    }
  }

  if (elapsedTime >= maxWaitTime) {
    throw new Error("Video generation timeout after 10 minutes");
  }

  updateProgress(90);

  if (operation.error) {
    throw new Error(
      (operation.error.message as string) || "Video generation failed.",
    );
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error(
      "Video generation completed, but no download link was found.",
    );
  }

  updateProgress(95);

  const videoResponse = await fetch(
    `${downloadLink}&key=${process.env.GEMINI_API_KEY}`,
  );
  if (!videoResponse.ok) {
    throw new Error(
      `Failed to download video. Status: ${videoResponse.statusText}`,
    );
  }

  updateProgress(100);

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
}
