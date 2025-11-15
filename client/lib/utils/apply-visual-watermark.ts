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

        // Draw watermark to fill entire image area
        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(watermarkImage, 0, 0, canvas.width, canvas.height);
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
      // Instead of rejecting, try to continue with current canvas state
      // If image can't load, proceed with watermark on blank canvas
      console.warn("⚠️ Continuing with watermark on empty canvas");

      const watermarkImage = new Image();
      watermarkImage.crossOrigin = "anonymous";

      watermarkImage.onload = () => {
        console.log("✅ Watermark image loaded");

        // Set minimum canvas size if base image didn't load
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = watermarkImage.width;
          canvas.height = watermarkImage.height;
        }

        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(watermarkImage, 0, 0, canvas.width, canvas.height);
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

      watermarkImage.onerror = () => {
        console.error("❌ Failed to load both images");
        reject(new Error("Failed to load both base and watermark images"));
      };

      watermarkImage.src = watermarkUrl;
    };

    baseImage.src = imageUrl;
  });
}
