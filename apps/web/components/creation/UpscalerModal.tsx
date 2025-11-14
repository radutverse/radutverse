import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UpscalerModalProps {
  imageUrl: string;
  onClose: () => void;
  onUpscale: (upscaledUrl: string) => void;
}

type UpscaleLevel = "2x" | "4x";

const UpscalerModal = ({
  imageUrl,
  onClose,
  onUpscale,
}: UpscalerModalProps) => {
  const [selectedLevel, setSelectedLevel] = useState<UpscaleLevel>("2x");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upscaleLevels: Array<{
    value: UpscaleLevel;
    label: string;
    scale: number;
  }> = [
    { value: "2x", label: "2x Upscale", scale: 2 },
    { value: "4x", label: "4x Upscale", scale: 4 },
  ];

  const handleUpscale = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const scale = selectedLevel === "2x" ? 2 : 4;

      const canvas = document.createElement("canvas");
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Canvas context not available");
          setIsProcessing(false);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const upscaledUrl = canvas.toDataURL("image/png", 0.95);
        onUpscale(upscaledUrl);
      };

      img.onerror = () => {
        setError("Failed to load image for upscaling");
        setIsProcessing(false);
      };

      img.src = imageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upscaling failed");
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-[#FF4DA6]/20 p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF4DA6] mb-1">
              Image Enhancement
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Upscale Image</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all focus:outline-none"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="mb-8 rounded-xl overflow-hidden bg-black/50 border border-slate-800/50">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-[250px] object-cover"
          />
        </div>

        {/* Upscale Level Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Upscale Level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {upscaleLevels.map(({ value, label, scale }) => (
              <button
                key={value}
                onClick={() => setSelectedLevel(value)}
                disabled={isProcessing}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedLevel === value
                    ? "border-[#FF4DA6] bg-[#FF4DA6]/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="font-semibold text-slate-100">{label}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {scale}x resolution increase
                </div>
                {selectedLevel === value && (
                  <motion.div
                    layoutId="activeLevel"
                    className="absolute top-1 right-1"
                    initial={false}
                  >
                    <svg
                      className="h-5 w-5 text-[#FF4DA6]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 rounded-lg bg-red-900/20 border border-red-800/50 p-4"
            >
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Message */}
        <div className="mb-8 rounded-lg bg-blue-900/20 border border-blue-800/50 p-4">
          <p className="text-sm text-blue-300">
            Upscaling will increase the image resolution and improve quality.
            This may take a moment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpscale}
            disabled={isProcessing}
            className="flex-1 bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Upscaling...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 20v-4m0 4h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                  />
                </svg>
                Upscale Now
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpscalerModal;
