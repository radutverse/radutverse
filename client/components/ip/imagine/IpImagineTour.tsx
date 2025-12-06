import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TourStep } from "@/hooks/useIpImagineTour";

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface IpImagineTourProps {
  tourStep: TourStep;
  uploadButtonRect: ElementRect | null;
  inputRect: ElementRect | null;
  submitButtonRect: ElementRect | null;
  onNext: () => void;
  onSkip: () => void;
}

const tourContent: Record<
  Exclude<TourStep, null>,
  { title: string; description: string }
> = {
  upload: {
    title: "Upload or Select an Image",
    description:
      "Click here to upload an image or select from the popular IP assets above.",
  },
  input: {
    title: "Describe Your Creation",
    description:
      "Write a prompt describing what you want to create or remix. Be as detailed as you like!",
  },
  submit: {
    title: "Generate",
    description:
      "Click to generate your IP asset. The system will create your image and add it to your portfolio.",
  },
};

export function IpImagineTour({
  tourStep,
  uploadButtonRect,
  inputRect,
  submitButtonRect,
  onNext,
  onSkip,
}: IpImagineTourProps) {
  const isActive = tourStep !== null;
  let targetRect: ElementRect | null = null;
  let content = { title: "", description: "" };

  if (tourStep === "upload" && uploadButtonRect) {
    targetRect = uploadButtonRect;
    content = tourContent.upload;
  } else if (tourStep === "input" && inputRect) {
    targetRect = inputRect;
    content = tourContent.input;
  } else if (tourStep === "submit" && submitButtonRect) {
    targetRect = submitButtonRect;
    content = tourContent.submit;
  }

  return (
    <AnimatePresence>
      {isActive && targetRect && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
            aria-hidden="true"
          />

          {/* Highlight ring around target element */}
          <motion.div
            className="fixed pointer-events-none z-50 rounded-lg border-2 border-[#FF4DA6] shadow-lg"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-[#FF4DA6]"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255, 77, 166, 0.7)",
                  "0 0 0 12px rgba(255, 77, 166, 0)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          </motion.div>

          {/* Tooltip with instructions */}
          <motion.div
            className="fixed z-50 bg-slate-900/95 border border-[#FF4DA6]/50 rounded-xl p-4 shadow-2xl max-w-sm"
            style={{
              top: Math.max(16, targetRect.top - 200),
              left: Math.max(
                16,
                Math.min(
                  window.innerWidth - 400,
                  targetRect.left + targetRect.width / 2 - 200,
                ),
              ),
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[#FF4DA6] text-sm mb-1">
                  {content.title}
                </h3>
                <p className="text-sm text-slate-200">{content.description}</p>
              </div>
              <button
                onClick={onSkip}
                className="text-slate-400 hover:text-slate-200 flex-shrink-0"
                aria-label="Close tour"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={onSkip}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={onNext}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white font-semibold transition-colors"
              >
                {tourStep === "submit" ? "Done" : "Next"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
