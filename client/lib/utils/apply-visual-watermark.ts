/**
 * Apply visible watermark to an image
 * Overlays a watermark image on the generated image
 */
export async function applyVisualWatermark(
  imageUrl: string,
  watermarkUrl: string,
  watermarkOpacity: number = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous";

    baseImage.onload = () => {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      ctx.drawImage(baseImage, 0, 0);

      const watermarkImage = new Image();
      watermarkImage.crossOrigin = "anonymous";

      watermarkImage.onload = () => {
        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(watermarkImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        canvas.toBlob((blob) => {
          if (blob) {
            const watermarkedUrl = URL.createObjectURL(blob);
            resolve(watermarkedUrl);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/png");
      };

      watermarkImage.onerror = () => {
        reject(new Error("Failed to load watermark image"));
      };

      watermarkImage.src = watermarkUrl;
    };

    baseImage.onerror = () => {
      reject(new Error("Failed to load base image"));
    };

    baseImage.src = imageUrl;
  });
}
