/**
 * Apply a simple text watermark to demo images
 * Creates a diagonal watermark overlay with text
 */
export async function applyDemoWatermark(
  imageUrl: string,
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

    baseImage.onload = () => {
      console.log("✅ Base image loaded for demo watermark");
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // Draw base image
      ctx.drawImage(baseImage, 0, 0);

      // Draw watermark text in bottom-right corner
      const padding = 20;
      const fontSize = Math.max(20, Math.min(canvas.width, canvas.height) * 0.05);

      // Semi-transparent background for text
      const textWidth = 200;
      const textHeight = 50;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        canvas.width - textWidth - padding,
        canvas.height - textHeight - padding,
        textWidth,
        textHeight
      );

      // White text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        "PAID REMIX",
        canvas.width - padding - 10,
        canvas.height - padding - 10
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const watermarkedUrl = URL.createObjectURL(blob);
          console.log("✅ Demo watermark applied successfully");
          resolve(watermarkedUrl);
        } else {
          console.error("❌ Failed to create blob from canvas");
          reject(new Error("Failed to create blob from canvas"));
        }
      }, "image/png");
    };

    baseImage.onerror = (error) => {
      console.error("❌ Failed to load base image:", imageUrl, error);
      reject(new Error("Failed to load base image"));
    };

    baseImage.src = imageUrl;
  });
}
