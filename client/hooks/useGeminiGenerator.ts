import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CreationContext } from "@/context/CreationContext";
import * as geminiService from "@/services/geminiService";
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
    navigate("/creation-result");

    try {
      let generatedUrl: string;

      if (mode === "image") {
        setLoadingMessage("Crafting your image...");
        if (options.image) {
          generatedUrl = await geminiService.editImage(
            options.prompt,
            options.image,
            apiKey,
          );
        } else {
          generatedUrl = await geminiService.generateImageFromText(
            options.prompt,
            apiKey,
          );
        }
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
        setResultType("video");
      }

      setResultUrl(generatedUrl);
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

      const upscaledUrl = await geminiService.upscaleImage(
        { imageBytes: base64Data, mimeType },
        apiKey,
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
