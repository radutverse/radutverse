import { useState, useCallback, useRef, useEffect } from "react";

export type TourStep = null | "upload" | "input" | "submit";

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useIpImagineTour() {
  const [tourStep, setTourStep] = useState<TourStep>(null);
  const [uploadButtonRect, setUploadButtonRect] = useState<ElementRect | null>(
    null,
  );
  const [inputRect, setInputRect] = useState<ElementRect | null>(null);
  const [submitButtonRect, setSubmitButtonRect] = useState<ElementRect | null>(
    null,
  );
  const tourShownRef = useRef(false);

  const updateElementRect = useCallback(
    (
      element: HTMLElement | null,
      setter: (rect: ElementRect | null) => void,
    ) => {
      if (!element) {
        setter(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setter({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    },
    [],
  );

  const startTour = useCallback(() => {
    if (tourShownRef.current) return;
    tourShownRef.current = true;
    setTourStep("upload");

    // Track upload button
    const uploadButton = document.querySelector(
      "[data-tour-upload]",
    ) as HTMLElement;
    updateElementRect(uploadButton, setUploadButtonRect);
  }, [updateElementRect]);

  const nextStep = useCallback(() => {
    setTourStep((current) => {
      let nextStep: TourStep = current;

      if (current === "upload") {
        nextStep = "input";
      } else if (current === "input") {
        nextStep = "submit";
      }

      // Schedule update of next element's rect for next render
      if (nextStep !== current && nextStep !== null) {
        setTimeout(() => {
          if (nextStep === "input") {
            const input = document.querySelector(
              "[data-chat-input]",
            ) as HTMLElement;
            updateElementRect(input, setInputRect);
          } else if (nextStep === "submit") {
            const submitButton = document.querySelector(
              "[data-tour-submit]",
            ) as HTMLElement;
            updateElementRect(submitButton, setSubmitButtonRect);
          }
        }, 100);
      }

      return nextStep;
    });
  }, [updateElementRect]);

  const skipTour = useCallback(() => {
    setTourStep(null);
  }, []);

  const completeTour = useCallback(() => {
    setTourStep(null);
  }, []);

  // Handle window resize to update element positions
  useEffect(() => {
    if (tourStep === null) return;

    const handleResize = () => {
      if (tourStep === "upload") {
        const uploadButton = document.querySelector(
          "[data-tour-upload]",
        ) as HTMLElement;
        updateElementRect(uploadButton, setUploadButtonRect);
      } else if (tourStep === "input") {
        const input = document.querySelector(
          "[data-chat-input]",
        ) as HTMLElement;
        updateElementRect(input, setInputRect);
      } else if (tourStep === "submit") {
        const submitButton = document.querySelector(
          "[data-tour-submit]",
        ) as HTMLElement;
        updateElementRect(submitButton, setSubmitButtonRect);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tourStep, updateElementRect]);

  return {
    tourStep,
    uploadButtonRect,
    inputRect,
    submitButtonRect,
    startTour,
    nextStep,
    skipTour,
    completeTour,
  };
}
