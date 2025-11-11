import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CreationContext } from "@/context/CreationContext";
import * as openaiService from "@/services/openaiService";
import { GenerationOptions } from "@/types/generation";

const useImageGenerator = () => {
  const context = useContext(CreationContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error(
      "useImageGenerator must be used within a CreationProvider",
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
    options: GenerationOptions,
  ) => {
    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    setResultType(null);
    navigate("/creation-result");

    try {
      setLoadingMessage("Crafting your image...");
      let generatedUrl: string;

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
      setResultType("image");
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

export default useImageGenerator;
