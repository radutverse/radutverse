import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatHeaderActions from "@/components/ip-assistant/ChatHeaderActions";
import SidebarExtras from "@/components/ip-assistant/SidebarExtras";
import IpImagineInput from "@/components/ip-imagine/Input";
import {
  PopularIPGrid,
  AddRemixImageModal,
  type PreviewImagesState,
} from "@/components/remix-mode";
import useGeminiGenerator from "@/hooks/useGeminiGenerator";
import { getCurrentTimestamp } from "@/lib/ip-assistant/utils";
import { calculateBlobHash } from "@/lib/utils/hash";
import { calculatePerceptualHash } from "@/lib/utils/perceptual-hash";
import { getImageVisionDescription } from "@/lib/utils/vision-api";

const IpImagine = () => {
  const { generate, isLoading, resultUrl } = useGeminiGenerator();

  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<PreviewImagesState>({
    remixImage: null,
    additionalImage: null,
  });
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [showAddRemixImageModal, setShowAddRemixImageModal] = useState(false);
  const [remixAnalysisOpen, setRemixAnalysisOpen] = useState(false);
  const [remixAnalysisData, setRemixAnalysisData] = useState<any>(null);
  const [remixOwnerDomain, setRemixOwnerDomain] = useState<{
    domain: string | null;
    loading: boolean;
  }>({ domain: null, loading: false });
  const [creationMode, setCreationMode] = useState<"image" | "video">("image");

  const uploadRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  // Track new results for stacking effect
  useEffect(() => {
    if (resultUrl && !resultUrls.includes(resultUrl)) {
      setResultUrls((prev) => [resultUrl, ...prev].slice(0, 5));
    }
  }, [resultUrl]);

  useEffect(() => {
    let mounted = true;
    const fetchDomain = async (ownerAddress: string) => {
      try {
        setRemixOwnerDomain({ domain: null, loading: true });
        const res = await fetch("/api/resolve-owner-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress }),
        });
        if (!mounted) return;
        if (!res.ok) {
          setRemixOwnerDomain({ domain: null, loading: false });
          return;
        }
        const data = await res.json();
        setRemixOwnerDomain({ domain: data.domain || null, loading: false });
      } catch (err) {
        if (!mounted) return;
        console.warn("Failed to resolve owner domain:", err);
        setRemixOwnerDomain({ domain: null, loading: false });
      }
    };

    if (remixAnalysisOpen && remixAnalysisData?.whitelist?.metadata) {
      const md = remixAnalysisData.whitelist.metadata;
      const owner = md.ownerAddress || md.owner || null;
      if (owner) fetchDomain(owner);
    } else {
      setRemixOwnerDomain({ domain: null, loading: false });
    }

    return () => {
      mounted = false;
    };
  }, [remixAnalysisOpen, remixAnalysisData]);

  const compressToBlob = useCallback(
    async (file: File, maxWidth = 800, quality = 0.75): Promise<Blob> =>
      new Promise((resolve, reject) => {
        if (!file.type || !file.type.startsWith("image/")) {
          reject(new Error("File is not an image"));
          return;
        }
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => {
            try {
              const scale = Math.min(1, maxWidth / img.width);
              const width = Math.round(img.width * scale);
              const height = Math.round(img.height * scale);
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Canvas not supported"));
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error("Compression failed"));
                    return;
                  }
                  resolve(blob);
                },
                "image/jpeg",
                quality,
              );
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      }),
    [],
  );

  const compressAndEnsureSize = useCallback(
    async (file: File, targetSize = 250 * 1024): Promise<Blob> => {
      let quality = 0.75;
      let maxWidth = 800;
      let blob = await compressToBlob(file, maxWidth, quality);
      let attempts = 0;
      while (blob.size > targetSize && attempts < 6) {
        if (quality > 0.4) {
          quality = Math.max(0.35, quality - 0.15);
        } else {
          maxWidth = Math.max(300, Math.floor(maxWidth * 0.8));
        }
        try {
          blob = await compressToBlob(file, maxWidth, quality);
        } catch (error) {
          console.error("Compression loop error", error);
          break;
        }
        attempts += 1;
      }
      return blob;
    },
    [compressToBlob],
  );

  const handleImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target?.files?.[0];
        if (!file) return;
        if (event.currentTarget) event.currentTarget.value = "";

        // Handle video files
        if (creationMode === "video" && file.type.startsWith("video/")) {
          const fileSizeInMB = file.size / (1024 * 1024);
          if (fileSizeInMB > 100) {
            setStatusText(
              `⚠️ Video file is too large (${fileSizeInMB.toFixed(1)}MB). Max 100MB allowed.`,
            );
            return;
          }

          const url = URL.createObjectURL(file);
          setPreviewImages((prev) => ({
            ...prev,
            remixImage: { blob: file, name: file.name || "video.mp4", url },
            additionalImage: null,
          }));
          setStatusText(`✓ Video loaded: ${file.name}`);
          return;
        }

        // Handle image files
        if (!file.type.startsWith("image/")) {
          setStatusText(
            `⚠️ File must be an image${creationMode === "video" ? " or video" : ""}.`,
          );
          return;
        }

        let blob: Blob;
        try {
          blob = await compressAndEnsureSize(file, 250 * 1024);
        } catch (err) {
          console.warn("Compression failed, using original file", err);
          blob = file;
        }

        const url = URL.createObjectURL(blob);

        // Calculate hashes and check whitelist
        setAttachmentLoading(true);
        try {
          const hash = await calculateBlobHash(blob);
          const pHash = await calculatePerceptualHash(blob);
          let whitelistResult: any = { found: false };
          try {
            const res = await fetch("/api/check-remix-hash", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hash, pHash }),
            });
            if (res.ok) whitelistResult = await res.json();
          } catch (err) {
            console.warn("Whitelist check failed:", err);
          }

          if (!whitelistResult || whitelistResult.found !== true) {
            setPreviewImages((prev) => ({
              ...prev,
              remixImage: { blob, name: file.name || "image.jpg", url },
              additionalImage: null,
            }));
            setAttachmentLoading(false);
            return;
          }

          // Upload for analysis
          let analysisData: any = null;
          try {
            const form = new FormData();
            form.append("image", blob, file.name || "image.jpg");
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            if (uploadRes.ok) analysisData = await uploadRes.json();
          } catch (err) {
            console.warn("Analysis upload failed:", err);
          }

          setRemixAnalysisData({
            blob,
            name: file.name || "image.jpg",
            url,
            hash,
            whitelist: whitelistResult,
            analysis: analysisData,
          });
          setRemixAnalysisOpen(true);
          setAttachmentLoading(false);
          return;
        } catch (err) {
          console.error("Remix analysis failed:", err);
          setAttachmentLoading(false);
        }

        // default: attach as additional image
        setPreviewImages((prev) => ({
          ...prev,
          additionalImage: { blob, name: file.name || "image.jpg", url },
        }));
      } catch (error) {
        console.error("handleImage error", error);
      }
    },
    [compressAndEnsureSize, setPreviewImages, creationMode],
  );

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
      title="IP Imagine"
      avatarSrc={null}
      actions={headerActions}
      sidebarExtras={sidebarExtras}
    >
      <div className="chat-box px-3 sm:px-4 md:px-12 pt-4 pb-24 flex-1 overflow-y-auto bg-transparent scroll-smooth">
        <AnimatePresence initial={false} mode="popLayout">
          <PopularIPGrid
            key="popular-ip-grid"
            onBack={() => {
              /* no-op for standalone imagine */
            }}
          />
        </AnimatePresence>

        <div />
      </div>

      <IpImagineInput
        input={input}
        setInput={setInput}
        waiting={waiting || isLoading}
        previewImages={previewImages}
        setPreviewImages={setPreviewImages}
        uploadRef={uploadRef}
        handleImage={handleImage}
        resultUrl={resultUrl}
        resultUrls={resultUrls}
        onSubmit={async () => {
          if (
            !input.trim() &&
            !previewImages.remixImage &&
            !previewImages.additionalImage
          )
            return;

          if (creationMode === "video") {
            setStatusText("��� Video generation is coming soon!");
            return;
          }

          setWaiting(true);
          setStatusText("✨ Starting generation...");

          try {
            const imageToSend =
              previewImages.remixImage || previewImages.additionalImage;
            let imageData: { imageBytes: string; mimeType: string } | undefined;

            if (imageToSend) {
              const blob = imageToSend.blob;
              const arrayBuffer = await blob.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const binaryString = String.fromCharCode.apply(
                null,
                Array.from(bytes),
              );
              imageData = {
                imageBytes: btoa(binaryString),
                mimeType: blob.type || "image/jpeg",
              };
            }

            await generate(creationMode, {
              prompt: input,
              image: imageData,
            });

            setInput("");
            setPreviewImages({ remixImage: null, additionalImage: null });
          } catch (error) {
            console.error("Generation error:", error);
            setStatusText("❌ Generation failed. Please try again.");
          } finally {
            setWaiting(false);
          }
        }}
        inputRef={inputRef}
        handleKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            // trigger submit
            (
              document.querySelector("[data-chat-input]") as HTMLTextAreaElement
            )?.blur();
          }
        }}
        toolsOpen={false}
        setToolsOpen={() => {}}
        suggestions={[]}
        setSuggestions={() => {}}
        attachmentLoading={attachmentLoading}
        onRemixRegisterWarning={() => {
          setWaiting(false);
          setStatusText(
            "⚠ Remix images cannot be registered. Please remove the image to register.",
          );
        }}
        onAddRemixImage={() => setShowAddRemixImageModal(true)}
        creationMode={creationMode}
        setCreationMode={setCreationMode}
      />

      <input
        ref={uploadRef}
        type="file"
        accept={creationMode === "video" ? "video/*,image/*" : "image/*"}
        className="hidden"
        onChange={handleImage}
      />

      <AnimatePresence>
        {remixAnalysisOpen && remixAnalysisData ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setRemixAnalysisOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              className="relative z-10 w-full max-w-xl rounded-2xl bg-slate-900/90 border border-[#FF4DA6]/20 p-6 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4DA6]">
                    Remix analysis
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    {remixAnalysisData.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setRemixAnalysisOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-[#FF4DA6]/20 hover:text-[#FF4DA6] focus:outline-none"
                  aria-label="Close analysis modal"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <img
                    src={remixAnalysisData.url}
                    alt="preview"
                    className="w-full rounded-md object-cover"
                  />
                </div>

                <div className="md:col-span-2">
                  {remixAnalysisData.whitelist &&
                  remixAnalysisData.whitelist.metadata ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400">Title:</div>
                        <div className="text-sm font-semibold text-slate-100">
                          {remixAnalysisData.whitelist.metadata.title || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">IP ID:</div>
                        <div className="text-sm font-mono text-slate-200">
                          {remixAnalysisData.whitelist.metadata.ipId ||
                            remixAnalysisData.whitelist.metadata.ownerAddress ||
                            "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">Domain:</div>
                        <div className="text-sm text-slate-200">
                          {remixOwnerDomain.loading ? (
                            <span className="text-xs text-slate-400">
                              Resolving domain…
                            </span>
                          ) : remixOwnerDomain.domain ? (
                            remixOwnerDomain.domain
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No domain registered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300">
                      No metadata available
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImages({
                          remixImage: {
                            blob: remixAnalysisData.blob,
                            name: remixAnalysisData.name,
                            url: remixAnalysisData.url,
                          },
                          additionalImage: null,
                        });
                        setRemixAnalysisOpen(false);
                        // Navigate user to imagine area (stay on page)
                        setInput("");
                        inputRef.current?.focus?.();

                        setStatusText(
                          `✨ Remix mode activated for "${remixAnalysisData.name}". You can now remix this image!`,
                        );
                      }}
                      className="px-4 py-2 rounded-lg bg-[#FF4DA6] text-white font-semibold hover:bg-[#FF4DA6]/80"
                    >
                      Remix this
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showAddRemixImageModal && (
          <AddRemixImageModal
            isOpen={showAddRemixImageModal}
            onClose={() => setShowAddRemixImageModal(false)}
            onSelectImage={(asset: any) => {
              // set selected image as remix
              const blob = asset.blob || null;
              const url = asset.preview || asset.url || "";
              setPreviewImages({
                remixImage: blob
                  ? { blob, name: asset.name || "selected", url }
                  : null,
                additionalImage: null,
              } as any);
              setShowAddRemixImageModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default IpImagine;
