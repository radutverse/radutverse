import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";

const CreationResult = () => {
  const { creations, removeCreation, upscale, isLoading, error } =
    useGeminiGenerator();

  const [showUpscaler, setShowUpscaler] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState<
    typeof creations[0] | null
  >(null);

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleUpscale = async () => {
    if (!apiKey || !selectedCreation) return;
    await upscale(apiKey);
    setShowUpscaler(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <DashboardLayout title="Creation Result">
      <div className="flex-1 overflow-y-auto bg-transparent px-4 sm:px-6 md:px-12 py-8 pb-24">
        {creations.length === 0 ? (
          <div className="text-center text-slate-400">
            No creations found
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
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square border-2 border-slate-700/50 hover:border-slate-600"
              >
                {creation.type === "image" ? (
                  <img
                    src={creation.url}
                    alt="Creation thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video src={creation.url} className="w-full h-full object-cover" />
                )}

                {/* Tombol titik tiga */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCreation(creation);
                    setShowUpscaler(true);
                  }}
                  className="absolute top-1 right-1 z-10 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  ⋮
                </button>

                {/* Tombol hapus */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCreation(creation.id);
                  }}
                  className="absolute bottom-1 right-1 z-10 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Modal Upscaler */}
        <AnimatePresence>
          {showUpscaler && selectedCreation && (
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
                    src={selectedCreation.url}
                    alt="Preview"
                    className="w-full h-auto max-h-[250px] object-cover"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowUpscaler(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpscale}
                    className="flex-1 bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white"
                  >
                    Upscale Now
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
