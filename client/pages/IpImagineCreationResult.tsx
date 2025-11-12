import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import LoadingBox from "@/components/ip-imagine/results/LoadingBox";
import CompactResultCard from "@/components/ip-imagine/results/CompactResultCard";
import ResultUpscaleModal from "@/components/ip-imagine/results/ResultUpscaleModal";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";

const IpImagineCreationResult = () => {
  const navigate = useNavigate();
  const { resultUrl, resultType, isLoading, loadingMessage, error, upscale } =
    useGeminiGenerator();

  const [showUpscaler, setShowUpscaler] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

  const handleDownload = () => {
    if (!displayUrl) return;
    const link = document.createElement("a");
    link.href = displayUrl;
    link.download = `ip-imagine-${Date.now()}${displayType === "video" ? ".mp4" : ".png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!displayUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "IP Imagine Creation",
          text: "Check out my AI-generated creation from IP Imagine!",
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
    if (!displayUrl) return;
    await upscale(apiKey);
    setShowUpscaler(false);
  };

  const displayUrl = resultUrl;
  const displayType = resultType;

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

            {!isQuotaError && !isAuthError && (
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
                <p className="text-sm text-slate-300 font-mono break-words">
                  {error}
                </p>
              </div>
            )}

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
    <DashboardLayout title="IP Imagine Result">
      <div className="flex-1 overflow-y-auto bg-transparent">
        <div className="px-4 sm:px-6 md:px-12 py-8 pb-24">
          {/* Upscale Success Message */}
          <AnimatePresence>
            {upscaledUrl && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="fixed top-48 left-6 z-30 rounded-xl bg-emerald-900/20 border border-emerald-800/50 p-4 flex items-start gap-3 max-w-sm"
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
        </div>
      </div>

      {/* Loading Box or Compact Result Card - Top Left */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingBox key="loading" message={loadingMessage || "Crafting your image..."} />
        ) : displayUrl && displayType ? (
          <CompactResultCard
            key="result"
            imageUrl={upscaledUrl || displayUrl}
            type={displayType}
            isLoading={isLoading}
            onDownload={handleDownload}
            onShare={handleShare}
            onUpscale={
              displayType === "image" ? () => setShowUpscaler(true) : undefined
            }
            onCreateAnother={() => navigate("/ip-imagine")}
          />
        ) : null}
      </AnimatePresence>

      {/* Upscale Modal */}
      <AnimatePresence>
        {showUpscaler && displayUrl && (
          <ResultUpscaleModal
            imageUrl={displayUrl}
            isLoading={isLoading}
            onClose={() => setShowUpscaler(false)}
            onUpscale={handleUpscale}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default IpImagineCreationResult;
