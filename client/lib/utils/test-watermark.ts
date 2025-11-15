import { applyVisualWatermark } from "./apply-visual-watermark";

/**
 * Test watermark application
 * Usage in browser console: import testWatermark from '@/lib/utils/test-watermark'; 
 * testWatermark('imageUrl', 'watermarkUrl', 0.35)
 */
export async function testWatermark(
  imageUrl: string,
  watermarkUrl: string,
  opacity: number = 0.35
) {
  try {
    console.log("🔍 Testing watermark application...");
    console.log("Image URL:", imageUrl);
    console.log("Watermark URL:", watermarkUrl);
    console.log("Opacity:", opacity);

    const result = await applyVisualWatermark(imageUrl, watermarkUrl, opacity);
    
    console.log("✅ Watermark test successful!");
    console.log("Result URL:", result);
    
    // Open in new window to view
    window.open(result, '_blank');
    
    return result;
  } catch (error) {
    console.error("❌ Watermark test failed:", error);
    throw error;
  }
}

export default testWatermark;
