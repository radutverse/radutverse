import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import UpscalerModal from "@/components/creation/UpscalerModal";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";

const CreationResult = () => {
  const navigate = useNavigate();
  const {
    resultUrl,
    resultType,
    isLoading,
    loadingMessage,
    error,
    upscale,
    creations,
    removeCreation,
  } = useGeminiGenerator();

  const [showUpscaler, setShowUpscaler] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleDownload = () => {
    if (!displayUrl) return;
    const link = document.createElement("a");
    link.href = displayUrl;
    link.download = `creation-${Date.now()}${displayType === "video" ? ".mp4" : ".png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!displayUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "IP Creation Result",
          text: "Check out my AI-generated creation!",
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleUpscale = async () => {
    if (!apiKey) {
      alert(
        "API key not found. Please set VITE_GEMINI_API_KEY environment variable.",
      );
      return;
    }
    await upscale(apiKey);
    setShowUpscaler(false);
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
    const isQuotaError =
      error.includes("quota") ||
      error.includes("Quota") ||
      error.includes("exceeded");
    const isAuthError =
      error.includes("API key") ||
      error.includes("not valid") ||
      error.includes("PERMISSION_DENIED");

    return (
      <DashboardLayout title="Creation Result">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            {/* Error Alert */}
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
                    {isQuotaError
                      ? "Usage Limit Exceeded"
                      : isAuthError
                        ? "Authentication Error"
                        : "Generation Failed"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Quota Error - Simple Message */}
            {isQuotaError && (
              <div className="rounded-2xl bg-amber-900/20 border border-amber-800/50 p-6 mb-6">
                <div className="flex gap-4">
                  <div className="text-3xl">⏳</div>
                  <div>
                    <p className="text-amber-300 font-semibold mb-2">
                      Generation Limit Reached
                    </p>
                    <p className="text-sm text-amber-200/80 leading-relaxed">
                      You've reached your daily generation limit. Please try
                      again later or contact support for more information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auth Error - Simple Message */}
            {isAuthError && (
              <div className="rounded-2xl bg-orange-900/20 border border-orange-800/50 p-6 mb-6">
                <div className="flex gap-4">
                  <div className="text-3xl">⚠️</div>
                  <div>
                    <p className="text-orange-300 font-semibold mb-2">
                      Configuration Error
                    </p>
                    <p className="text-sm text-orange-200/80 leading-relaxed">
                      There's an issue with the generation service. Please
                      refresh the page and try again, or contact support if the
                      problem persists.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generic Error Message */}
            {!isQuotaError && !isAuthError && (
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
                <p className="text-sm text-slate-300 font-mono break-words">
                  {error}
                </p>
              </div>
            )}

            {/* Action Buttons */}
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
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Get the currently selected creation or use the first one
  const currentCreation =
    selectedId && creations.find((c) => c.id === selectedId)
      ? creations.find((c) => c.id === selectedId)
      : resultUrl
        ? null
        : creations[0];

  const displayUrl = currentCreation?.url || resultUrl;
  const displayType = currentCreation?.type || resultType;

  if (!displayUrl || !displayType) {
    return (
      <DashboardLayout title="Creation Result">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-slate-400 mb-4">No creation data found</p>
            <Button onClick={() => navigate("/ip-imagine")}>
              Back to IP Imagine
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Creation Result">
      <div className="flex-1 overflow-y-auto bg-transparent">
        <div className="px-4 sm:px-6 md:px-12 py-8 pb-24">
          {/* Gallery Grid */}
          {creations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Generation History
                </h3>
                <span className="text-sm text-slate-400">
                  {creations.length} creation{creations.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 rounded-lg bg-slate-900/30 p-4 border border-slate-800/50">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCreation(creation.id);
                          if (selectedId === creation.id) {
                            setSelectedId(null);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-700 text-white rounded-full p-2"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute top-1 right-1 text-xs font-medium bg-slate-900/80 text-slate-300 px-2 py-1 rounded">
                      {creation.type === "image" ? "🖼" : "🎬"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            {/* Media Display */}
            <div className="mb-8">
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-[#FF4DA6]/20 p-1">
                <div className="bg-black rounded-xl overflow-hidden">
                  {displayType === "image" ? (
                    <img
                      src={upscaledUrl || displayUrl}
                      alt="Generated creation"
                      className="w-full h-auto object-cover max-h-[600px]"
                    />
                  ) : (
                    <video
                      src={displayUrl}
                      controls
                      className="w-full h-auto object-cover max-h-[600px]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Prompt & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <div className="rounded-xl bg-slate-900/50 border border-slate-800/50 p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Result Type
                  </h3>
                  <p className="text-slate-200 leading-relaxed capitalize">
                    {displayType} generation completed successfully
                  </p>
                </div>
              </div>

              <div>
                <div className="rounded-xl bg-slate-900/50 border border-slate-800/50 p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Type</div>
                      <div className="text-slate-200 capitalize font-medium">
                        {displayType}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Generated At
                      </div>
                      <div className="text-slate-200 text-xs">
                        {new Date().toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                onClick={handleDownload}
                className="bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </Button>

              {displayType === "image" && (
                <Button
                  onClick={() => setShowUpscaler(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                  variant="outline"
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 20v-4m0 4h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                  Upscale
                </Button>
              )}

              <Button
                onClick={handleShare}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                variant="outline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C9.589 12.438 10.994 12 12.505 12c1.511 0 2.916.438 3.821 1.342m-9.821 7.115c-3.848-3.848-3.848-10.088 0-13.936 3.848-3.848 10.088-3.848 13.936 0 3.848 3.848 3.848 10.088 0 13.936-3.848 3.848-10.088 3.848-13.936 0z"
                  />
                </svg>
                Share
              </Button>

              <Button
                onClick={() => navigate("/ip-imagine")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 ml-auto"
                variant="outline"
              >
                Create Another
              </Button>
            </div>

            {/* Upscaled Status */}
            <AnimatePresence>
              {upscaledUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-xl bg-emerald-900/20 border border-emerald-800/50 p-4 flex items-start gap-3"
                >
                  <svg
                    className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-emerald-300 font-medium">
                      Upscale completed!
                    </p>
                    <p className="text-xs text-emerald-200 mt-1">
                      Image has been enhanced to higher resolution
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Upscaler Modal */}
      <AnimatePresence>
        {showUpscaler && resultUrl && (
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
                  src={resultUrl}
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
    </DashboardLayout>
  );
};

export default CreationResult;
