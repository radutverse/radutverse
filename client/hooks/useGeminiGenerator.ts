import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CreationContext } from "@/context/CreationContext";
import * as geminiService from "@/services/geminiService";
import * as openaiService from "@/services/openaiService";
import { GenerationOptions, ToggleMode } from "@/types/generation";

const useGeminiGenerator = () => {
  const context = useContext(CreationContext);
  const navigate = useNavigate();

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
    setProgress,
  } = context;

  const generate = async (
    mode: ToggleMode,
    options: GenerationOptions,
    apiKey: string,
  ) => {
    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    setResultType(null);

    // Start progress and run generation in background. We'll simulate progress
    // updates based on estimated durations so the UI can display a percentage.
    setProgress(0);
    const startTime = Date.now();
    const estimatedDuration = mode === "video" ? 120000 : 8000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
      setProgress(pct);
    }, 500);

    // Generation should run in the background. Navigation to results is now manual
    // via the gallery/Results button to avoid interrupting the user's flow.

    try {
      let generatedUrl: string;
      let type: "image" | "video";

      if (mode === "image") {
        setLoadingMessage("Crafting your image...");
        if (options.image) {
          generatedUrl = await openaiService.editImage(
            options.prompt,
            options.image,
          );
        } else {
          generatedUrl = await openaiService.generateImageFromText(
            options.prompt,
          );
        }
        type = "image";
        setResultType("image");
      } else {
        setLoadingMessage("Initializing video generation...");
        const timeout1 = setTimeout(
          () =>
            setLoadingMessage(
              "Warming up the pixels... This can take a few minutes.",
            ),
          20000,
        );
        const timeout2 = setTimeout(
          () =>
            setLoadingMessage("Almost there, composing your masterpiece..."),
          60000,
        );

        generatedUrl = await geminiService.generateVideo(options, apiKey);

        clearTimeout(timeout1);
        clearTimeout(timeout2);
        type = "video";
        setResultType("video");
      }

      setResultUrl(generatedUrl);
      addCreation(generatedUrl, type);

      // Mark progress complete and clear the interval
      setProgress(100);
      clearInterval(progressInterval);
      // keep 100% visible briefly before resetting
      setTimeout(() => setProgress(0), 2000);
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
      clearInterval(progressInterval);
      setProgress(0);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const upscale = async (apiKey: string) => {
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

      const upscaledUrl = await openaiService.upscaleImage({
        imageBytes: base64Data,
        mimeType,
      });
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
