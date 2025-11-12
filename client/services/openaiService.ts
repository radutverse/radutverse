export const generateImageFromText = async (
  prompt: string,
): Promise<string> => {
  if (!prompt) throw new Error("Prompt is required.");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image generation failed");
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text || `Image generation failed with status ${response.status}`,
        );
      }
    }

    const data = await response.json();

    if (data.url) {
      return data.url;
    }

    throw new Error("Image generation failed: No image URL received.");
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
    const binaryString = atob(image.imageBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: image.mimeType });

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    formData.append("prompt", prompt);

    const response = await fetch("/api/edit", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image editing failed");
      } catch (parseError) {
        const text = await response.text();
        throw new Error(
          text || `Image editing failed with status ${response.status}`,
        );
      }
    }

    const data = await response.json();

    if (data.url) {
      return data.url;
    }

    throw new Error("Image editing failed: No image URL received.");
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
