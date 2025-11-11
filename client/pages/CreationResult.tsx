import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatHeaderActions from "@/components/ip-assistant/ChatHeaderActions";
import SidebarExtras from "@/components/ip-assistant/SidebarExtras";

interface GenerationProgress {
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  progressMessage: string;
  result?: string | null;
  error?: string | null;
}

const CreationResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const [generationData, setGenerationData] = useState<GenerationProgress | null>(
    null
  );
  const [upscaling, setUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);

  // Poll for generation progress
  useEffect(() => {
    if (!sessionId) {
      navigate("/ip-imagine");
      return;
    }

    const pollProgress = async () => {
      try {
        const res = await fetch(
          `/api/generation-progress?sessionId=${sessionId}`
        );
        if (res.ok) {
          const data = await res.json();
          setGenerationData(data);

          // If completed or error, stop polling
          if (data.status === "completed" || data.status === "error") {
            return false; // Stop polling
          }
          return true; // Continue polling
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      }
      return true;
    };

    // Initial poll
    pollProgress().then((shouldContinue) => {
      if (!shouldContinue) return;

      // Set up interval
      const interval = setInterval(async () => {
        const shouldContinue = await pollProgress();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    });
  }, [sessionId, navigate]);

  const handleUpscale = useCallback(async () => {
    if (!generationData?.result) return;

    setUpscaling(true);
    setUpscaleProgress(0);

    try {
      // Extract base64 from data URL
      const base64Match = generationData.result.match(/base64,(.+)$/);
      const base64 = base64Match ? base64Match[1] : generationData.result;
      const mimeType = generationData.result.includes("jpeg")
        ? "image/jpeg"
        : "image/png";

      // Request upscaling
      const res = await fetch("/api/upscale-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: mimeType,
        }),
      });

      if (res.ok) {
        const { sessionId: upscaleSessionId } = await res.json();

        // Poll for upscale progress
        const pollUpscale = async () => {
          try {
            const progressRes = await fetch(
              `/api/generation-progress?sessionId=${upscaleSessionId}`
            );
            if (progressRes.ok) {
              const data = await progressRes.json();
              setUpscaleProgress(data.progress);

              if (data.status === "completed") {
                setGenerationData((prev) =>
                  prev ? { ...prev, result: data.result } : null
                );
                setUpscaling(false);
                return false;
              } else if (data.status === "error") {
                console.error("Upscale error:", data.error);
                setUpscaling(false);
                return false;
              }
              return true;
            }
          } catch (error) {
            console.error("Failed to fetch upscale progress:", error);
          }
          return true;
        };

        pollUpscale().then((shouldContinue) => {
          if (!shouldContinue) return;

          const interval = setInterval(async () => {
            const shouldContinue = await pollUpscale();
            if (!shouldContinue) {
              clearInterval(interval);
            }
          }, 1000);
        });
      }
    } catch (error) {
      console.error("Upscale error:", error);
      setUpscaling(false);
    }
  }, [generationData?.result]);

  const handleDownload = useCallback(() => {
    if (!generationData?.result) return;

    const link = document.createElement("a");
    link.href = generationData.result;
    link.download = `creation-${Date.now()}.${
      generationData.result.includes("jpeg") ? "jpg" : "png"
    }`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generationData?.result]);

  const headerActions = (
    <ChatHeaderActions
      guestMode={false}
      onToggleGuest={() => {}}
      walletButtonText="Connect"
      walletButtonDisabled={true}
      onWalletClick={() => {}}
    />
  );

  const sidebarExtras = (opts: { closeSidebar: () => void }) => (
    <SidebarExtras
      messages={[]}
      sessions={[]}
      onNewChat={() => {
        opts.closeSidebar();
      }}
      onLoadSession={(id: string) => {}}
      onDeleteSession={(id: string) => {}}
      closeSidebar={opts.closeSidebar}
      onOpenWhitelistMonitor={() => {}}
    />
  );

  return (
    <DashboardLayout
      title="Creation Result"
      avatarSrc={null}
      actions={headerActions}
      sidebarExtras={sidebarExtras}
    >
      <div className="flex-1 overflow-y-auto bg-transparent flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!generationData ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="text-slate-400">Connecting to session...</div>
              </motion.div>
            ) : generationData.status === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-center py-12"
              >
                <div className="text-red-400 text-lg font-semibold mb-4">
                  ❌ Generation Failed
                </div>
                <div className="text-slate-300 mb-6">{generationData.error}</div>
                <button
                  onClick={() => navigate("/ip-imagine")}
                  className="px-6 py-2 bg-[#FF4DA6] text-white rounded-lg hover:bg-[#FF4DA6]/80 transition"
                >
                  Back to Creation
                </button>
              </motion.div>
            ) : generationData.status === "completed" ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-center py-8"
              >
                <div className="text-green-400 text-lg font-semibold mb-4">
                  ✨ Generation Complete!
                </div>

                {generationData.result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    {generationData.result.includes("video") ? (
                      <video
                        src={generationData.result}
                        controls
                        className="w-full rounded-lg max-h-96 bg-black"
                      />
                    ) : (
                      <img
                        src={generationData.result}
                        alt="Generated result"
                        className="w-full rounded-lg max-h-96 object-cover"
                      />
                    )}
                  </motion.div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  {!generationData.result.includes("video") && (
                    <button
                      onClick={handleUpscale}
                      disabled={upscaling}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {upscaling
                        ? `Upscaling... ${Math.round(upscaleProgress)}%`
                        : "🔍 Upscale Image"}
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2 bg-[#FF4DA6] text-white rounded-lg hover:bg-[#FF4DA6]/80 transition"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => navigate("/ip-imagine")}
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    ← Back
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <div className="text-4xl">✨</div>
                </motion.div>

                <div className="text-slate-300 text-lg font-semibold mb-2">
                  {generationData.progressMessage}
                </div>

                <div className="w-full bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${generationData.progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#FF4DA6] to-purple-500"
                  />
                </div>

                <div className="text-sm text-slate-400">
                  {Math.round(generationData.progress)}%
                </div>

                <div className="mt-6 text-xs text-slate-500 italic">
                  You can safely leave this page - generation will continue in
                  the background for up to 10 minutes.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreationResult;
