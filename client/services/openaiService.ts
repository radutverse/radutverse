export const generateImageFromText = async (
  prompt: string,
): Promise<string> => {
  if (!prompt) throw new Error("Prompt is required.");

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Image generation failed");
    }

    const data = await response.json();

    if (data.data && data.mimeType) {
      return `data:${data.mimeType};base64,${data.data}`;
    }

    throw new Error("Image generation failed: No image data received.");
  } catch (error) {
    throw error;
  }
};

export const editImage = async (
  prompt: string,
  image: { imageBytes: string; mimeType: string },
): Promise<string> => {
  if (!prompt) throw new Error("Prompt is required.");
  if (!image || !image.imageBytes)
    throw new Error("Image is required for editing.");

  try {
    // Validate image size (base64 encoded)
    const maxBase64Size = 4 * 1024 * 1024 * 0.75; // ~3MB in base64
    if (image.imageBytes.length > maxBase64Size) {
      throw new Error(
        "Image is too large. Maximum 4MB allowed for editing. Please upload a smaller image.",
      );
    }

    // Validate image format
    if (
      image.mimeType !== "image/png" &&
      image.mimeType !== "image/jpeg" &&
      image.mimeType !== "image/webp"
    ) {
      throw new Error(
        "Image format not supported. Please use PNG, JPEG, or WebP.",
      );
    }

    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        image: {
          data: image.imageBytes,
          mimeType: image.mimeType,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error || "Image editing failed";

      // If image format issue, suggest conversion
      if (errorMsg.includes("PNG")) {
        throw new Error(
          "Image must be in PNG format for editing. Please convert your image to PNG and try again.",
        );
      }

      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (data.data && data.mimeType) {
      return `data:${data.mimeType};base64,${data.data}`;
    }

    throw new Error("Image editing failed: No image data received.");
  } catch (error) {
    throw error;
  }
};

export const upscaleImage = async (image: {
  imageBytes: string;
  mimeType: string;
}): Promise<string> => {
  const prompt =
    "Create a high-resolution upscaled version of this image with enhanced details and improved clarity without changing the composition.";

  try {
    return await editImage(prompt, image);
  } catch (error) {
    throw error;
  }
};
