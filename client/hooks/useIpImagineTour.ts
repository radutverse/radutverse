import { useState, useCallback, useRef } from "react";

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
      if (current === "upload") {
        // Track input element
        const input = document.querySelector(
          "[data-chat-input]",
        ) as HTMLElement;
        updateElementRect(input, setInputRect);
        return "input";
      }
      if (current === "input") {
        // Track submit button
        const submitButton = document.querySelector(
          "[data-tour-submit]",
        ) as HTMLElement;
        updateElementRect(submitButton, setSubmitButtonRect);
        return "submit";
      }
      return current;
    });
  }, [updateElementRect]);

  const skipTour = useCallback(() => {
    setTourStep(null);
  }, []);

  const completeTour = useCallback(() => {
    setTourStep(null);
  }, []);

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
