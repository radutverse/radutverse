import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ResultUpscaleModalProps {
  imageUrl: string;
  isLoading: boolean;
  onClose: () => void;
  onUpscale: () => void;
}

const ResultUpscaleModal = ({
  imageUrl,
  isLoading,
  onClose,
  onUpscale,
}: ResultUpscaleModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative z-10 w-full max-w-sm sm:max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-[#FF4DA6]/20 p-4 sm:p-6 shadow-2xl my-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-start justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF4DA6] mb-1">
              Image Enhancement
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Upscale Image</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all flex-shrink-0"
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 sm:mb-6 rounded-xl overflow-hidden bg-black/50 border border-slate-800/50">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-[200px] sm:max-h-[300px] object-contain"
          />
        </div>

        <div className="mb-6 rounded-lg bg-blue-900/20 border border-blue-800/50 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-300">
            Upscaling will increase the image resolution and improve quality
            using AI enhancement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100"
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpscale}
            className="flex-1 bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Upscaling..." : "Upscale Now"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultUpscaleModal;
