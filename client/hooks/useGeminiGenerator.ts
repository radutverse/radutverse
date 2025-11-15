import { useContext } from "react";
import { CreationContext } from "@/context/CreationContext";
import * as openaiService from "@/services/openaiService";
import { GenerationOptions, ToggleMode } from "@/types/generation";
import { applyVisualWatermark } from "@/lib/utils/apply-visual-watermark";

const useGeminiGenerator = () => {
  const context = useContext(CreationContext);

  if (!context) {
    throw new Error(
      "useGeminiGenerator must be used within a CreationProvider",
    );
  }

  const {
    setIsLoading,
    setLoadingMessage,
    setError,
    setResultUrl,
    setResultType,
    resultUrl,
    addCreation,
    setOriginalPrompt,
    demoMode,
  } = context;


  const watermarkImageUrl =
    "https://drive.google.com/uc?export=download&id=1-Xtbeb74oX034vvg5Xj4s73dlgTNHRUh";

  const paidRemixWatermarkedImageUrl =
    "https://cdn.builder.io/api/v1/image/assets%2Fb58d02d806854ce7935f858301fe2d0e%2F4d2e3210864a407990fca21794f79921?format=webp&width=800";

  const generate = async (
    mode: ToggleMode,
    options: GenerationOptions,
    demoModeParam: boolean = false,
  ) => {
    if (mode === "video") {
      setError("Video generation is coming soon!");
      return;
    }

    setIsLoading(true);
    setError(null);
    // Keep the previous image visible while loading (both demo and real)
    // This creates a stacking carousel effect where users see all generations
    setOriginalPrompt(options.prompt);

    try {
      let generatedUrl: string;
      let type: "image" | "video";

      setLoadingMessage("Crafting your image...");
      if (options.image) {
        generatedUrl = await openaiService.editImage(
          options.prompt,
          options.image,
          demoModeParam,
        );
      } else {
        generatedUrl = await openaiService.generateImageFromText(
          options.prompt,
          demoModeParam,
        );
      }

      type = "image";
      setResultType("image");

      // Apply watermark for paid remix
      let finalUrl = generatedUrl;
      const { remixType, assetData } = options;

      if (remixType === "paid") {
        try {
          if (demoModeParam) {
            // For demo mode paid remix, use the provided watermarked image
            console.log("📸 Using demo mode watermarked image");
            finalUrl = paidRemixWatermarkedImageUrl;
          } else {
            // For production paid remix, apply visual watermark overlay
            console.log("🎨 Applying visual watermark overlay");
            finalUrl = await applyVisualWatermark(
              generatedUrl,
              watermarkImageUrl,
              0.35,
            );
          }
        } catch (watermarkError) {
          console.error("❌ Failed to apply watermark:", watermarkError);
          // Continue with unwatermarked image if watermark fails
          finalUrl = generatedUrl;
        }
      }

      setResultUrl(finalUrl);
      addCreation(finalUrl, type, options.prompt, demoModeParam, remixType);
    } catch (e: any) {
      console.error(e);
      let errorMessage =
        e.message || "An unknown error occurred during generation.";
      if (
        e.message &&
        (e.message.includes("API key not valid") ||
          e.message.includes("404") ||
          e.message.includes("PERMISSION_DENIED"))
      ) {
        errorMessage =
          "Your API key is invalid or project billing is not enabled. Please check your key and try again.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const upscale = async () => {
    if (!resultUrl || !resultUrl.startsWith("data:image")) {
      setError("Upscaling is only available for a generated image.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage("Upscaling image...");
      const [header, base64Data] = resultUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";

      const upscaledUrl = await openaiService.upscaleImage(
        {
          imageBytes: base64Data,
          mimeType,
        },
        context.demoMode,
      );
      setResultUrl(upscaledUrl);
      setResultType("image");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unknown error occurred during upscaling.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return { generate, upscale, ...context };
};

export default useGeminiGenerator;
