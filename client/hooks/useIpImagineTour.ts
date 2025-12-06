import { useState, useCallback, useRef, useEffect } from "react";

export type TourStep = null | "upload" | "input" | "submit";

export function useIpImagineTour() {
  const [tourStep, setTourStep] = useState<TourStep>(null);
  const [targetElementRect, setTargetElementRect] = useState<DOMRect | null>(
    null,
  );
  const tourShownRef = useRef(false);

  const updateElementRect = useCallback((element: HTMLElement | null) => {
    if (!element) {
      setTargetElementRect(null);
      return;
    }
    setTargetElementRect(element.getBoundingClientRect());
  }, []);

  const startTour = useCallback(() => {
    if (tourShownRef.current) return;
    tourShownRef.current = true;
    setTourStep("upload");

    const uploadButton = document.querySelector(
      "[data-tour-upload]",
    ) as HTMLElement;
    updateElementRect(uploadButton);
  }, [updateElementRect]);

  const nextStep = useCallback(() => {
    setTourStep((current) => {
      let nextStep: TourStep = current;

      if (current === "upload") {
        nextStep = "input";
      } else if (current === "input") {
        nextStep = "submit";
      } else if (current === "submit") {
        nextStep = null;
      }

      if (nextStep !== null) {
        setTimeout(() => {
          if (nextStep === "input") {
            const input = document.querySelector(
              "[data-chat-input]",
            ) as HTMLElement;
            updateElementRect(input);
          } else if (nextStep === "submit") {
            const submitButton = document.querySelector(
              "[data-tour-submit]",
            ) as HTMLElement;
            updateElementRect(submitButton);
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

  useEffect(() => {
    if (tourStep === null) return;

    const handleResize = () => {
      if (tourStep === "upload") {
        const uploadButton = document.querySelector(
          "[data-tour-upload]",
        ) as HTMLElement;
        updateElementRect(uploadButton);
      } else if (tourStep === "input") {
        const input = document.querySelector(
          "[data-chat-input]",
        ) as HTMLElement;
        updateElementRect(input);
      } else if (tourStep === "submit") {
        const submitButton = document.querySelector(
          "[data-tour-submit]",
        ) as HTMLElement;
        updateElementRect(submitButton);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tourStep, updateElementRect]);

  return {
    tourStep,
    targetElementRect,
    startTour,
    nextStep,
    skipTour,
    completeTour,
  };
}
