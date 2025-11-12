import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ResultDetailsPanel from "./ResultDetailsPanel";

interface CompactResultCardProps {
  imageUrl: string;
  type: "image" | "video";
  isLoading: boolean;
  onDownload: () => void;
  onShare: () => void;
  onUpscale?: () => void;
  onCreateAnother: () => void;
}

const CompactResultCard = ({
  imageUrl,
  type,
  isLoading,
  onDownload,
  onShare,
  onUpscale,
  onCreateAnother,
}: CompactResultCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed top-6 left-6 z-40">
      {/* Small Image Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-[#FF4DA6]/30 shadow-lg group"
      >
        {type === "image" ? (
          <img
            src={imageUrl}
            alt="Generation result"
            className="w-full h-full object-cover"
          />
        ) : (
          <video src={imageUrl} className="w-full h-full object-cover" />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-white/20"
            type="button"
            title="Options"
            aria-label="Show details and actions"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>

        {/* Type Badge */}
        <div className="absolute top-1 right-1 text-xs font-medium bg-slate-900/80 text-slate-300 px-2 py-1 rounded">
          {type === "image" ? "🖼" : "🎬"}
        </div>
      </motion.div>

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <ResultDetailsPanel
            type={type}
            isLoading={isLoading}
            onDownload={() => {
              onDownload();
              setShowDetails(false);
            }}
            onShare={() => {
              onShare();
              setShowDetails(false);
            }}
            onUpscale={
              onUpscale
                ? () => {
                    onUpscale();
                    setShowDetails(false);
                  }
                : undefined
            }
            onCreateAnother={() => {
              onCreateAnother();
              setShowDetails(false);
            }}
            onClose={() => setShowDetails(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompactResultCard;
