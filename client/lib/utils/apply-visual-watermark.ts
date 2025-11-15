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
      console.error("❌ Failed to get canvas context");
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const baseImage = new Image();
    // Allow data URLs (from demo mode) to be used directly
    if (!imageUrl.startsWith("data:")) {
      baseImage.crossOrigin = "anonymous";
    }

    baseImage.onload = () => {
      console.log("✅ Base image loaded", imageUrl.substring(0, 50));
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // Draw base image
      ctx.drawImage(baseImage, 0, 0);

      const watermarkImage = new Image();
      watermarkImage.crossOrigin = "anonymous";

      watermarkImage.onload = () => {
        console.log("✅ Watermark image loaded");
        const watermarkSize = Math.min(canvas.width, canvas.height) * 0.25;
        const padding = 15;

        // Draw watermark in bottom-right corner
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
            console.log("✅ Watermark applied successfully");
            resolve(watermarkedUrl);
          } else {
            console.error("❌ Failed to create blob from canvas");
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/png");
      };

      watermarkImage.onerror = (error) => {
        console.error(
          "❌ Failed to load watermark image:",
          watermarkUrl,
          error,
        );
        // Fallback: return base image without watermark
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            console.warn("⚠️ Watermark failed, returning base image");
            resolve(url);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/png");
      };

      watermarkImage.src = watermarkUrl;
    };

    baseImage.onerror = (error) => {
      console.error("❌ Failed to load base image:", imageUrl, error);
      reject(new Error("Failed to load base image"));
    };

    baseImage.src = imageUrl;
  });
}
