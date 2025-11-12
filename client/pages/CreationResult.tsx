import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import UpscalerModal from "@/components/creation/UpscalerModal";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";

const CreationResult = () => {
  const navigate = useNavigate();
  const {
    creations,
    removeCreation,
    upscale,
    isLoading,
    error,
  } = useGeminiGenerator();

  const [showUpscaler, setShowUpscaler] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select newest creation
  useEffect(() => {
    if (creations.length > 0) {
      setSelectedId(creations[0].id);
    }
  }, [creations]);

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleUpscale = async () => {
    if (!apiKey || !selectedId) return;
    const creation = creations.find((c) => c.id === selectedId);
    if (!creation) return;

    await upscale(apiKey);
    setShowUpscaler(false);
  };

  const handleDownload = (creationUrl: string, creationType: string) => {
    const link = document.createElement("a");
    link.href = creationUrl;
    link.download = `creation-${Date.now()}${
      creationType === "video" ? ".mp4" : ".png"
    }`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (creationUrl: string) => {
    try {
      if (navigator.share) {
        navigator.share({
          title: "IP Creation Result",
          text: "Check out my AI-generated creation!",
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Creation Result">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <svg
              className="h-16 w-16 text-[#FF4DA6]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </motion.div>
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Creating your masterpiece...
          </p>
          <p className="text-sm text-slate-400">This may take a moment</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Creation Result">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl bg-red-900/20 border border-red-800/50 p-6 mb-6">
              <div className="flex gap-3 mb-4">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-300">
                    Generation Failed
                  </h3>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
                <p className="text-sm text-slate-300 font-mono break-words">
                  {error}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate("/ip-imagine")}
                  className="bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white"
                >
                  Back to Generation
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100"
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Creation Result">
      <div className="flex-1 overflow-y-auto bg-transparent px-4 sm:px-6 md:px-12 py-8 pb-24">
        {/* Grid Gallery */}
        {creations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {creations.map((creation) => (
              <motion.div
                key={creation.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative group cursor-pointer rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                  selectedId === creation.id
                    ? "border-[#FF4DA6] ring-2 ring-[#FF4DA6]/50"
                    : "border-slate-700/50 hover:border-slate-600"
                }`}
                onClick={() => setSelectedId(creation.id)}
              >
                {creation.type === "image" ? (
                  <img
                    src={creation.url}
                    alt="Creation thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={creation.url}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Tombol Titik Tiga */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(creation.id);
                    setShowUpscaler(true);
                  }}
                  className="absolute top-1 right-1 z-10 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  ⋮
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center text-slate-400">
            No creations found
          </div>
        )}

        {/* Upscaler Modal */}
        <AnimatePresence>
          {showUpscaler && selectedId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowUpscaler(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="relative z-10 w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-[#FF4DA6]/20 p-8 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#FF4DA6] mb-1">
                      Image Enhancement
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">
                      Upscale Image
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowUpscaler(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-8 rounded-xl overflow-hidden bg-black/50 border border-slate-800/50">
                  <img
                    src={
                      creations.find((c) => c.id === selectedId)?.url || ""
                    }
                    alt="Preview"
                    className="w-full h-auto max-h-[250px] object-cover"
                  />
                </div>

                <div className="mb-8 rounded-lg bg-blue-900/20 border border-blue-800/50 p-4">
                  <p className="text-sm text-blue-300">
                    Upscaling will increase the image resolution and improve
                    quality using AI enhancement.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowUpscaler(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100"
                    variant="outline"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpscale}
                    className="flex-1 bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white disabled:opacity-70"
                    disabled={isLoading}
                  >
                    {isLoading ? "Upscaling..." : "Upscale Now"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default CreationResult;
