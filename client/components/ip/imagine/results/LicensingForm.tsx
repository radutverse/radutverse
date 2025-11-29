import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useIPRegistrationAgent } from "@/hooks/useIPRegistrationAgent";

interface LicensingFormProps {
  imageUrl: string;
  imageName?: string;
  type: "image" | "video";
  demoMode?: boolean;
  isLoading?: boolean;
  onClose?: () => void;
  onRegisterStart?: (state: {
    status: string;
    progress: number;
    error: any;
  }) => void;
  onRegisterComplete?: (result: { ipId?: string; txHash?: string }) => void;
}

// AI Generated group 1 (DIRECT_REGISTER_FIXED_AI)
const AI_GENERATED_GROUP = 1;

const LicensingForm = ({
  imageUrl,
  imageName = "generated-image.png",
  type,
  demoMode = false,
  isLoading = false,
  onClose,
  onRegisterStart,
  onRegisterComplete,
}: LicensingFormProps) => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { executeRegister, registerState } = useIPRegistrationAgent();

  const [mintingFee, setMintingFee] = useState<number | "">("");
  const [revShare, setRevShare] = useState<number | "">("");
  const [title, setTitle] = useState("AI Generated Image");
  const [description, setDescription] = useState(
    "Created using AI image generation technology",
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredIpId, setRegisteredIpId] = useState<string | null>(null);

  // AI Generated group 1 is FIXED_AI, so AI training is always disabled
  const aiTrainingDisabled = true;

  const handleConvertImageToFile = async (): Promise<File> => {
    if (!imageUrl) {
      throw new Error("No image URL available");
    }

    let blob: Blob;

    if (imageUrl.startsWith("data:")) {
      // Base64 data URL
      const [header, data] = imageUrl.split(",");
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
    } else if (imageUrl.startsWith("blob:")) {
      // Blob URL
      const response = await fetch(imageUrl);
      blob = await response.blob();
    } else {
      // Regular HTTP URL
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }

    return new File([blob], imageName, {
      type: blob.type || "image/png",
    });
  };

  const handleRegister = async () => {
    if (!imageUrl) {
      setRegisterError("No image to register");
      return;
    }

    if (!demoMode && !authenticated) {
      setRegisterError("Please connect wallet or enable demo mode to register");
      return;
    }

    setIsRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(false);

    try {
      // Convert image to File
      const file = await handleConvertImageToFile();

      if (onRegisterStart) {
        onRegisterStart({
          status: "preparing",
          progress: 0,
          error: null,
        });
      }

      // Get ethereum provider for wallet mode
      let ethProvider: any = undefined;
      if (!demoMode && wallets && wallets[0]?.getEthereumProvider) {
        try {
          ethProvider = await wallets[0].getEthereumProvider();
        } catch (err) {
          console.warn("Failed to get ethereum provider:", err);
        }
      }

      // Convert empty strings to undefined
      const mf = mintingFee === "" ? undefined : Number(mintingFee);
      const rs = revShare === "" ? undefined : Number(revShare);

      // Execute registration
      const result = await executeRegister(
        AI_GENERATED_GROUP,
        file,
        mf,
        rs,
        false, // aiTrainingManual - always false for group 1 (FIXED_AI)
        { title, prompt: description },
        ethProvider,
      );

      const ipId = result?.ipId || "pending";

      if (onRegisterComplete) {
        onRegisterComplete({
          ipId: ipId,
          txHash: result?.txHash,
        });
      }

      setRegisteredIpId(ipId);
      setRegisterSuccess(true);
      setSuccessMessage(
        demoMode
          ? "Demo registration successful!"
          : `IP registered successfully! ID: ${ipId}`,
      );
    } catch (error: any) {
      setRegisterError(error.message || "Registration failed");
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className={`w-full h-full ${registerSuccess ? "bg-slate-950" : "bg-slate-950"} p-4 space-y-3 flex flex-col`}>
      {/* Success Message */}
      {registerSuccess && (
        <div className="rounded-lg bg-emerald-950/50 border border-emerald-800/80 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-emerald-300 mb-2">
                ✅ Registration Successful!
              </h4>
              <p className="text-sm text-emerald-200 mb-3">
                {successMessage}
              </p>
              {registeredIpId && registeredIpId !== "pending" && (
                <a
                  href={`https://aeneid.explorer.story.foundation/ipa/${registeredIpId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  View on Explorer
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#FF4DA6]">
          {registerSuccess ? "Registration Details" : "Licensing your creation"}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 p-1"
            type="button"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        )}
      </div>

      {/* Form Content - Scrollable */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {/* Title Input */}
        <div className="space-y-1">
          <label className="text-sm text-slate-300 block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isRegistering || registerSuccess}
            className="w-full rounded px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-100 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF4DA6] focus:border-transparent"
            placeholder="Title"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label className="text-sm text-slate-300 block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRegistering || registerSuccess}
            className="w-full rounded px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-100 text-sm resize-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF4DA6] focus:border-transparent leading-tight"
            rows={2}
            placeholder="Description"
          />
        </div>

        {/* License Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300 block font-medium">Minting Fee</label>
            <input
              type="number"
              min={0}
              value={mintingFee === "" ? "" : mintingFee}
              onChange={(e) => {
                const v = e.target.value;
                setMintingFee(v === "" ? "" : Number(v));
              }}
              disabled={isRegistering || registerSuccess}
              className="w-full rounded px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-100 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF4DA6] focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300 block font-medium">RevShare %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={revShare === "" ? "" : revShare}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setRevShare("");
                const n = Number(v);
                setRevShare(Math.min(100, Math.max(0, isNaN(n) ? 0 : n)));
              }}
              disabled={isRegistering || registerSuccess}
              className="w-full rounded px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-100 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF4DA6] focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        {/* Registration Status */}
        {registerState.status !== "idle" && (
          <div className="rounded px-3 py-2 bg-blue-900/30 border border-blue-800 text-sm text-blue-300">
            <div className="flex items-center gap-2">
              <span className="inline-block animate-spin text-lg">⚙️</span>
              <span className="capitalize">{registerState.status}</span>
              {registerState.progress > 0 && (
                <span className="ml-auto text-sm">
                  {Math.round(registerState.progress)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {(registerError || registerState.error) && (
          <div className="rounded px-3 py-2 bg-red-900/30 border border-red-800 text-sm text-red-300">
            {registerError || registerState.error?.message || registerState.error}
          </div>
        )}

        {/* Auth Status */}
        {!demoMode && !authenticated && (
          <div className="rounded px-3 py-2 bg-amber-900/30 border border-amber-800 text-sm text-amber-300">
            ⚠️ Connect wallet to register
          </div>
        )}

        {demoMode && (
          <div className="rounded px-3 py-2 bg-blue-900/30 border border-blue-800 text-sm text-blue-300">
            🎭 Demo mode enabled
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-slate-800">
        {registerSuccess ? (
          <>
            {registeredIpId && registeredIpId !== "pending" && (
              <a
                href={`https://aeneid.explorer.story.foundation/ipa/${registeredIpId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded bg-emerald-600/30 px-3 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-600/40 transition-colors flex items-center justify-center gap-2 border border-emerald-800/50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Explorer
              </a>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`${registeredIpId && registeredIpId !== "pending" ? "flex-1" : "w-full"} rounded bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700`}
                type="button"
              >
                Close
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleRegister}
            disabled={
              isRegistering ||
              registerState.status !== "idle" ||
              (!demoMode && !authenticated) ||
              isLoading ||
              !imageUrl
            }
            className="w-full rounded bg-[#FF4DA6]/30 px-3 py-2.5 text-sm font-semibold text-[#FF4DA6] hover:bg-[#FF4DA6]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#FF4DA6]/50"
            type="button"
          >
            {isRegistering || registerState.status !== "idle" ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Registering
              </>
            ) : (
              "Register IP"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LicensingForm;
