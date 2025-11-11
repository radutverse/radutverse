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
  } = useGeminiGenerator();

  const [showUpscaler, setShowUpscaler] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `creation-${Date.now()}${resultType === "video" ? ".mp4" : ".png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!resultUrl) return;
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
      alert("API key not found. Please set VITE_GEMINI_API_KEY environment variable.");
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
    return (
      <DashboardLayout title="Creation Result">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md"
          >
            <div className="rounded-2xl bg-red-900/20 border border-red-800/50 p-6 mb-6">
              <div className="flex gap-3 mb-3">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0"
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
                  <p className="text-sm text-red-200 mt-1">{error}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/ip-imagine")}
                className="bg-[#FF4DA6] hover:bg-[#FF4DA6]/80 text-white"
              >
                Try Again
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

  if (!resultUrl || !resultType) {
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
                  {creationData.type === "image" ? (
                    <img
                      src={upscaledUrl || creationData.outputUrl}
                      alt="Generated creation"
                      className="w-full h-auto object-cover max-h-[600px]"
                    />
                  ) : (
                    <video
                      src={creationData.outputUrl}
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
                    Your Prompt
                  </h3>
                  <p className="text-slate-200 leading-relaxed">
                    {creationData.prompt}
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
                        {creationData.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Created</div>
                      <div className="text-slate-200 text-xs">
                        {new Date(creationData.timestamp).toLocaleString()}
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

              {creationData.type === "image" && (
                <Button
                  onClick={() => setShowUpscaler(true)}
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
        {showUpscaler && (
          <UpscalerModal
            imageUrl={creationData.outputUrl}
            onClose={() => setShowUpscaler(false)}
            onUpscale={handleUpscale}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CreationResult;
