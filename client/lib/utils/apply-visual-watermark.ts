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
        const watermarkSize = Math.min(canvas.width, canvas.height) * 0.2;
        const padding = 20;

        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(
          watermarkImage,
          canvas.width - watermarkSize - padding,
          canvas.height - watermarkSize - padding,
          watermarkSize,
          watermarkSize,
        );
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
