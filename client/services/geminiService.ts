import { GenerationOptions } from "@/types/generation";

// --- IMAGE GENERATION ---
export const generateImageFromText = async (
  prompt: string,
  apiKey: string,
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required.");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generation_config: {
            response_modalities: ["image", "text"],
          },
        }),
      },
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Image generation failed");
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text || `Image generation failed with status ${response.status}`,
        );
      }
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0];

    if (imageData?.inlineData?.data) {
      return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
    }

    throw new Error("Image generation failed: No image data received.");
  } catch (error) {
    throw error;
  }
};

export const editImage = async (
  prompt: string,
  image: { imageBytes: string; mimeType: string },
  apiKey: string,
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required.");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.imageBytes,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generation_config: {
            response_modalities: ["image", "text"],
          },
        }),
      },
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Image editing failed");
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text || `Image editing failed with status ${response.status}`,
        );
      }
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0];

    if (imageData?.inlineData?.data) {
      return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
    }

    throw new Error("Image editing failed: No image data received.");
  } catch (error) {
    throw error;
  }
};

export const upscaleImage = async (
  image: { imageBytes: string; mimeType: string },
  apiKey: string,
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required.");

  try {
    const prompt =
      "Upscale this image, enhance details, improve clarity, and increase resolution. Do not change the content.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.imageBytes,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generation_config: {
            response_modalities: ["image", "text"],
          },
        }),
      },
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Image upscaling failed");
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text || `Image upscaling failed with status ${response.status}`,
        );
      }
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0];

    if (imageData?.inlineData?.data) {
      return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
    }

    throw new Error("Image upscaling failed: No image data received.");
  } catch (error) {
    throw error;
  }
};

// --- VIDEO GENERATION ---
const pollOperation = async (
  operationName: string,
  apiKey: string,
  maxAttempts = 60,
): Promise<any> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/${operationName}`,
        {
          headers: {
            "x-goog-api-key": apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to check operation status: ${response.statusText}`,
        );
      }

      const operation = await response.json();

      if (operation.done) {
        return operation;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    } catch (error) {
      console.error("Polling error:", error);
      throw error;
    }
  }

  throw new Error(
    "Video generation timeout: operation did not complete in time.",
  );
};

export const generateVideo = async (
  options: GenerationOptions,
  apiKey: string,
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is required.");
  }

  try {
    const requestBody: any = {
      display_name: "Generated Video",
      prompt: options.prompt,
    };

    if (options.image) {
      requestBody.config = {
        number_of_frames: 120,
      };
      requestBody.start_frame = {
        inlineData: {
          mimeType: options.image.mimeType,
          data: options.image.imageBytes,
        },
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Video generation initiation failed",
        );
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text ||
            `Video generation initiation failed with status ${response.status}`,
        );
      }
    }

    const operation = await response.json();
    const operationName = operation.name;

    if (!operationName) {
      throw new Error(
        "No operation name returned from video generation request",
      );
    }

    const completedOperation = await pollOperation(operationName, apiKey);

    if (completedOperation.error) {
      throw new Error(
        completedOperation.error.message || "Video generation failed",
      );
    }

    const videoData = completedOperation.response?.generatedVideos?.[0];
    if (!videoData?.video?.uri) {
      throw new Error("Video generation failed: no download link found.");
    }

    const downloadLink = videoData.video.uri;

    try {
      const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!videoResponse.ok) {
        throw new Error(
          `Failed to download video: ${videoResponse.statusText}`,
        );
      }
      const videoBlob = await videoResponse.blob();
      return URL.createObjectURL(videoBlob);
    } catch (downloadError) {
      console.error("Video download error:", downloadError);
      return downloadLink;
    }
  } catch (error) {
    throw error;
  }
};
