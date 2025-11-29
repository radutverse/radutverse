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
    "Created using AI image generation technology"
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

      if (onRegisterComplete) {
        onRegisterComplete({
          ipId: result?.ipId,
          txHash: result?.txHash,
        });
      }

      setRegisterSuccess(true);
      setSuccessMessage(
        demoMode
          ? "Demo registration successful!"
          : `IP registered successfully! ID: ${result?.ipId || "pending"}`
      );
    } catch (error: any) {
      setRegisterError(error.message || "Registration failed");
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Show success state
  if (registerSuccess) {
    return (
      <div className="mt-2 rounded-lg bg-emerald-900/20 border border-emerald-800/50 p-2">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"
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
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-emerald-300 mb-0.5">
              Registration Successful!
            </h4>
            <p className="text-xs text-emerald-200 truncate">{successMessage}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
              type="button"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg bg-slate-900/70 border border-slate-800/50 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#FF4DA6]">
          Register IP License
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            type="button"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        )}
      </div>

      {/* Title Input */}
      <div>
        <label className="text-sm text-slate-300 block mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isRegistering}
          className="w-full rounded-md bg-black/30 p-2 text-slate-100 text-sm disabled:opacity-50"
          placeholder="IP Asset Title"
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="text-sm text-slate-300 block mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isRegistering}
          className="w-full rounded-md bg-black/30 p-2 text-slate-100 text-sm resize-none disabled:opacity-50"
          rows={2}
          placeholder="Describe your asset..."
        />
      </div>

      {/* License Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-300 block mb-2">
            Minting Fee
          </label>
          <input
            type="number"
            min={0}
            value={mintingFee === "" ? "" : mintingFee}
            onChange={(e) => {
              const v = e.target.value;
              setMintingFee(v === "" ? "" : Number(v));
            }}
            disabled={isRegistering}
            className="w-full rounded-md bg-black/30 p-2 text-slate-100 text-sm disabled:opacity-50"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">
            Rev Share (%)
          </label>
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
            disabled={isRegistering}
            className="w-full rounded-md bg-black/30 p-2 text-slate-100 text-sm disabled:opacity-50"
            placeholder="0"
          />
        </div>
      </div>

      {/* AI Training (disabled for group 1) */}
      <div className="text-xs text-slate-400">
        ℹ️ AI training is not available for this license group
      </div>

      {/* Registration Status */}
      {registerState.status !== "idle" && (
        <div className="rounded-md bg-blue-900/20 border border-blue-800/50 p-3 text-sm text-blue-300">
          <div className="flex items-center gap-2">
            <span className="inline-block animate-spin text-base">⚙️</span>
            <span className="capitalize">{registerState.status}...</span>
            {registerState.progress > 0 && (
              <span className="ml-auto text-xs">
                {Math.round(registerState.progress)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {(registerError || registerState.error) && (
        <div className="rounded-md bg-red-900/20 border border-red-800/50 p-3 text-sm text-red-300">
          {registerError || registerState.error?.message || registerState.error}
        </div>
      )}

      {/* Auth Status */}
      {!demoMode && !authenticated && (
        <div className="rounded-md bg-amber-900/20 border border-amber-800/50 p-3 text-sm text-amber-300">
          ⚠️ Connect wallet to register, or enable Demo mode
        </div>
      )}

      {demoMode && (
        <div className="rounded-md bg-blue-900/20 border border-blue-800/50 p-3 text-sm text-blue-300">
          🎭 Demo mode: Registration preview only
        </div>
      )}

      {/* Register Button */}
      <button
        onClick={handleRegister}
        disabled={
          isRegistering ||
          registerState.status !== "idle" ||
          (!demoMode && !authenticated) ||
          isLoading ||
          !imageUrl
        }
        className="w-full rounded-md bg-[#FF4DA6]/20 px-4 py-2 text-sm font-semibold text-[#FF4DA6] hover:bg-[#FF4DA6]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        type="button"
      >
        {isRegistering || registerState.status !== "idle" ? (
          <>
            <span className="inline-block animate-spin mr-2">⚙️</span>
            Registering...
          </>
        ) : (
          "Register IP Asset"
        )}
      </button>
    </div>
  );
};

export default LicensingForm;
