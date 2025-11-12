import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";

const CreationResult = () => {
  const navigate = useNavigate();
  const {
    creations,
    isLoading,
    loadingMessage,
    error,
    removeCreation,
    upscale,
  } = useGeminiGenerator();

  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [selectedCreationId, setSelectedCreationId] = useState<string | null>(
    null
  );

  // Auto-select newest creation
  useEffect(() => {
    if (creations.length > 0) {
      setSelectedCreationId(creations[0].id);
    }
  }, [creations]);

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleDownload = (url: string, type: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `creation-${Date.now()}${type === "video" ? ".mp4" : ".png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleUpscale = async (id: string) => {
    const creation = creations.find((c) => c.id === id);
    if (!creation || creation.type !== "image") return;

    if (!apiKey) {
      alert("API key not found. Please set VITE_GEMINI_API_KEY.");
      return;
    }
    await upscale(apiKey);
    setDropdownId(null);
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
            {loadingMessage || "Creating your masterpiece..."}
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
          <p className="text-red-500 font-semibold text-lg">{error}</p>
          <Button onClick={() => navigate("/ip-imagine")} className="mt-4">
            Back to Generation
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Creation Result">
      <div className="flex-1 overflow-y-auto bg-transparent px-4 sm:px-6 md:px-12 py-8 pb-24">
        {creations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="text-slate-400">
              No creations yet. Generate something!
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {creations.map((creation) => (
              <motion.div
                key={creation.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square border-2 border-slate-700/50 hover:border-slate-600 bg-slate-800/30"
                onClick={() => setSelectedCreationId(creation.id)}
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

                {/* Tombol titik tiga */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownId(dropdownId === creation.id ? null : creation.id);
                  }}
                  className="absolute top-1 right-1 z-10 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  ⋮
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownId === creation.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-8 right-1 z-20 w-36 bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg overflow-hidden"
                    >
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-slate-800"
                        onClick={() => handleUpscale(creation.id)}
                        disabled={creation.type !== "image"}
                      >
                        Upscale
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-slate-800"
                        onClick={() =>
                          handleDownload(creation.url, creation.type)
                        }
                      >
                        Download
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-slate-800"
                        onClick={() => handleShare(creation.url)}
                      >
                        Share
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-red-700 text-red-200"
                        onClick={() => removeCreation(creation.id)}
                      >
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreationResult;
