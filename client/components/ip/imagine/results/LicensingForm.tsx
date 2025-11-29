import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useIPRegistrationAgent } from "@/hooks/useIPRegistrationAgent";
import {
  StoryClient,
  PILFlavor,
  WIP_TOKEN_ADDRESS,
} from "@story-protocol/core-sdk";
import {
  createWalletClient,
  custom,
  parseEther,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

interface LicensingFormProps {
  imageUrl: string;
  imageName?: string;
  type: "image" | "video";
  demoMode?: boolean;
  isLoading?: boolean;
  onClose?: () => void;
  parentAsset?: any;
  onRegisterStart?: (state: {
    status: string;
    progress: number;
    error: any;
  }) => void;
  onRegisterComplete?: (result: { ipId?: string; txHash?: string }) => void;
}

const LicensingForm = ({
  imageUrl,
  imageName = "generated-image.png",
  type,
  demoMode = false,
  isLoading = false,
  onClose,
  parentAsset,
  onRegisterStart,
  onRegisterComplete,
}: LicensingFormProps) => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { executeRegister, registerState } = useIPRegistrationAgent();

  const [title, setTitle] = useState("AI Generated Image");
  const [description, setDescription] = useState(
    "Created using AI image generation technology",
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredIpId, setRegisteredIpId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "buying-license" | "registering-child" | "success"
  >("idle");

  // Check if this is a paid remix with parent asset
  const isPaidRemix = parentAsset && parentAsset.licenses?.length > 0;
  const parentLicense = isPaidRemix
    ? parentAsset.licenses.find((l: any) => l.terms?.commercialUse === true)
    : null;

  // Get parent's revenue share (read-only, must match parent)
  const parentRevShare = parentLicense?.terms?.commercialRevShare ?? 0;
  const parentMintingFee =
    parentAsset?.licenses?.[0]?.licensingConfig?.mintingFee || "0";

  const handleConvertImageToFile = async (): Promise<File> => {
    if (!imageUrl) {
      throw new Error("No image URL available");
    }

    let blob: Blob;

    if (imageUrl.startsWith("data:")) {
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
      const response = await fetch(imageUrl);
      blob = await response.blob();
    } else {
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }

    return new File([blob], imageName, {
      type: blob.type || "image/png",
    });
  };

  const buyLicense = async (
    storyClient: any,
    parentIpId: string,
    licenseTermsId: string,
    receiver: string,
  ) => {
    try {
      setCurrentStep("buying-license");
      if (onRegisterStart) {
        onRegisterStart({
          status: "Buying license from parent IP...",
          progress: 30,
          error: null,
        });
      }

      const mintResult = await storyClient.license.mintLicenseTokens({
        licensorIpId: parentIpId as `0x${string}`,
        licenseTermsId,
        amount: 1,
        receiver: receiver as `0x${string}`,
        maxMintingFee: parentAsset?.licenses?.[0]?.licensingConfig
          ?.mintingFee || "0",
        maxRevenueShare: parentAsset?.maxRevenueShare || 100,
      });

      console.log("✅ License purchased:", mintResult);
      return mintResult;
    } catch (error) {
      console.error("❌ Failed to buy license:", error);
      throw error;
    }
  };

  const registerDerivative = async (
    storyClient: any,
    childIpId: string,
    parentIpId: string,
    licenseTermsId: string,
    childRevShare: number,
  ) => {
    try {
      setCurrentStep("registering-child");
      if (onRegisterStart) {
        onRegisterStart({
          status: "Registering derivative IP...",
          progress: 60,
          error: null,
        });
      }

      // Build license terms for child IP
      const childLicenseTerms = [
        {
          terms: PILFlavor.commercialRemix({
            commercialRevShare: childRevShare,
            defaultMintingFee: parseEther("0"),
            currency: WIP_TOKEN_ADDRESS,
          }),
        },
      ];

      const registerResult =
        await storyClient.ipAsset.registerDerivativeIpAssetWithPilTerms({
          childIpId: childIpId as `0x${string}`,
          parentIpIds: [parentIpId as `0x${string}`],
          licenseTermsIds: [licenseTermsId],
          licenseTermsData: childLicenseTerms,
          maxMintingFee: parentAsset?.licenses?.[0]?.licensingConfig
            ?.mintingFee || "0",
          maxRts: parentAsset?.maxRts || "100000000",
          maxRevenueShare: parentAsset?.maxRevenueShare || 100,
        });

      console.log("✅ Derivative registered:", registerResult);
      return registerResult;
    } catch (error) {
      console.error("❌ Failed to register derivative:", error);
      throw error;
    }
  };

  const handleRegister = async () => {
    if (!imageUrl) {
      setRegisterError("No image to register");
      return;
    }

    if (!isPaidRemix) {
      setRegisterError("Parent asset data required for licensing");
      return;
    }

    if (!parentLicense) {
      setRegisterError("No commercial license found on parent IP");
      return;
    }

    if (parentRevShare === undefined || parentRevShare === null) {
      setRegisterError("Parent IP revenue share not available");
      return;
    }

    if (!demoMode && !authenticated) {
      setRegisterError("Please connect wallet or enable demo mode");
      return;
    }

    setIsRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(false);

    try {
      // Step 1: Register child IP first
      const file = await handleConvertImageToFile();

      if (onRegisterStart) {
        onRegisterStart({
          status: "Preparing child IP registration...",
          progress: 10,
          error: null,
        });
      }

      // Get ethereum provider
      let ethProvider: any = undefined;
      if (!demoMode && wallets && wallets[0]?.getEthereumProvider) {
        try {
          ethProvider = await wallets[0].getEthereumProvider();
        } catch (err) {
          console.warn("Failed to get ethereum provider:", err);
        }
      }

      // Get wallet address
      let addr: string | undefined;
      if (ethProvider) {
        try {
          const walletClient = createWalletClient({
            transport: custom(ethProvider),
          });
          const [a] = await walletClient.getAddresses();
          if (a) addr = String(a);
        } catch {}
      }

      if (!addr) {
        try {
          const guestPk = (import.meta as any).env?.VITE_GUEST_PRIVATE_KEY;
          if (guestPk) {
            const normalized = String(guestPk).startsWith("0x")
              ? String(guestPk)
              : `0x${String(guestPk)}`;
            const guestAccount = privateKeyToAccount(
              normalized as `0x${string}`,
            );
            addr = guestAccount.address;
          }
        } catch {}
      }

      if (!addr) {
        throw new Error("Could not determine wallet address");
      }

      // Register child IP using the registration agent
      // Use parent's revenue share (child must match parent)
      const childResult = await new Promise((resolve, reject) => {
        executeRegister(
          1, // AI_GENERATED_GROUP
          file,
          undefined, // mintingFee
          parentRevShare, // Use parent's revShare (read-only)
          false, // aiTrainingManual
          { title, prompt: description },
          ethProvider,
        )
          .then(resolve)
          .catch(reject);
      });

      if (!childResult?.ipId) {
        throw new Error("Failed to register child IP");
      }

      const childIpId = childResult.ipId;

      // Step 2: Setup Story Client for Buy License + Register Derivative
      const rpcUrl = (import.meta as any).env?.VITE_PUBLIC_STORY_RPC;
      if (!rpcUrl) throw new Error("RPC URL not set");

      let storyClient: any;
      if (ethProvider) {
        storyClient = StoryClient.newClient({
          account: addr as any,
          transport: custom(ethProvider),
          chainId: "aeneid",
        });
      } else {
        const guestPk = (import.meta as any).env?.VITE_GUEST_PRIVATE_KEY;
        if (!guestPk) throw new Error("Guest key not configured");
        const normalized = String(guestPk).startsWith("0x")
          ? String(guestPk)
          : `0x${String(guestPk)}`;
        const guestAccount = privateKeyToAccount(normalized as `0x${string}`);
        storyClient = StoryClient.newClient({
          account: guestAccount as any,
          transport: http(rpcUrl),
          chainId: "aeneid",
        });
      }

      // Step 3: Buy license from parent IP
      const licenseTermsId = parentLicense.licenseTermsId;
      const mintLicenseResult = await buyLicense(
        storyClient,
        parentAsset.ipId,
        licenseTermsId,
        addr,
      );

      // Step 4: Register derivative with parent
      // Use parent's revenue share for child (must match parent)
      const registerDerivativeResult = await registerDerivative(
        storyClient,
        childIpId,
        parentAsset.ipId,
        licenseTermsId,
        parentRevShare,
      );

      if (onRegisterComplete) {
        onRegisterComplete({
          ipId: childIpId,
          txHash: registerDerivativeResult?.txHash,
        });
      }

      setCurrentStep("success");
      setRegisteredIpId(childIpId);
      setRegisterSuccess(true);
      setSuccessMessage(
        demoMode
          ? "Demo registration successful! Child IP registered as derivative."
          : `Derivative registered! ID: ${childIpId}`,
      );
    } catch (error: any) {
      setRegisterError(error.message || "Registration failed");
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="w-full h-full p-6 space-y-4 flex flex-col">
      {/* Success Message */}
      {registerSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-emerald-400 mb-1">
                Registration Successful!
              </h4>
              <p className="text-xs text-slate-400 mb-2">{successMessage}</p>
              {registeredIpId && registeredIpId !== "pending" && (
                <a
                  href={`https://aeneid.explorer.story.foundation/ipa/${registeredIpId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  View on Explorer
                  <svg
                    className="w-3.5 h-3.5"
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

      <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
        <h3 className="text-xl font-semibold text-[#FF4DA6]">
          {registerSuccess
            ? "Derivative Registered"
            : "License & Register Derivative"}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            type="button"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        )}
      </div>

      {/* Parent Asset Info */}
      {isPaidRemix && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Parent IP
          </p>
          <p className="text-sm text-slate-200 font-semibold mb-1">
            {parentAsset.title || "Untitled"}
          </p>
          <p className="text-xs text-slate-400 font-mono break-all">
            {parentAsset.ipId}
          </p>
          {parentLicense && (
            <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">License Terms ID:</span>
                <span className="text-slate-300 font-mono">
                  {parentLicense.licenseTermsId}
                </span>
              </div>
              {parentAsset.licenses?.[0]?.licensingConfig?.mintingFee && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Minting Fee:</span>
                  <span className="text-slate-300">
                    {(
                      Number(
                        parentAsset.licenses[0].licensingConfig.mintingFee,
                      ) / 1e18
                    ).toFixed(4)}{" "}
                    tokens
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 px-0.5 py-2">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Child IP Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isRegistering || registerSuccess}
            className="w-full rounded-lg px-4 py-2.5 bg-slate-800/30 border border-slate-700/50 text-slate-100 text-sm placeholder-slate-500 disabled:opacity-50 transition-colors focus:outline-none focus:border-[#FF4DA6] focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-[#FF4DA6]/40"
            placeholder="Enter child IP title"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400 font-medium">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRegistering || registerSuccess}
            className="w-full rounded-lg px-4 py-2.5 bg-slate-800/30 border border-slate-700/50 text-slate-100 text-sm placeholder-slate-500 resize-none disabled:opacity-50 transition-colors focus:outline-none focus:border-[#FF4DA6] focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-[#FF4DA6]/40 leading-relaxed"
            rows={2}
            placeholder="Describe your derivative work"
          />
        </div>

        {/* Revenue Share - Read-only, follows parent */}
        {isPaidRemix && (
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-medium">
              Revenue Share % (from parent IP)
            </label>
            <div className="w-full rounded-lg px-4 py-2.5 bg-slate-800/30 border border-slate-700/50 text-slate-100 text-sm flex items-center justify-between">
              <span className="font-semibold">{parentRevShare}%</span>
              <span className="text-xs text-slate-400">
                Inherited from parent
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Child IP revenue share must match parent IP's revenue share
            </p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="space-y-2 pt-3 border-t border-slate-800/50">
        {/* Registration Status */}
        {(registerState.status !== "idle" || currentStep !== "idle") && (
          <div className="rounded-lg px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 text-sm text-blue-400 flex items-center gap-2">
            <span className="inline-block animate-spin">⚙️</span>
            <span className="capitalize">
              {currentStep === "buying-license"
                ? "Buying license from parent IP..."
                : currentStep === "registering-child"
                  ? "Registering derivative IP..."
                  : registerState.status}
            </span>
            {registerState.progress > 0 && (
              <span className="ml-auto text-xs">
                {Math.round(registerState.progress)}%
              </span>
            )}
          </div>
        )}

        {/* Error Message */}
        {(registerError || registerState.error) && (
          <div className="rounded-lg px-3 py-2.5 bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {registerError ||
              registerState.error?.message ||
              registerState.error}
          </div>
        )}

        {/* Auth Status */}
        {!demoMode && !authenticated && (
          <div className="rounded-lg px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
            ⚠️ Connect wallet to register
          </div>
        )}

        {demoMode && (
          <div className="rounded-lg px-3 py-2.5 bg-slate-600/20 border border-slate-600/40 text-sm text-slate-400">
            🎭 Demo mode enabled
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3 border-t border-slate-800/50">
        {registerSuccess ? (
          <>
            {registeredIpId && registeredIpId !== "pending" && (
              <a
                href={`https://aeneid.explorer.story.foundation/ipa/${registeredIpId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-emerald-600/20 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2 border border-emerald-500/30"
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
                className={`${registeredIpId && registeredIpId !== "pending" ? "flex-1" : "w-full"} rounded-lg bg-slate-700/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700/60 transition-colors border border-slate-600/40`}
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
              currentStep !== "idle" ||
              (!demoMode && !authenticated) ||
              isLoading ||
              !imageUrl ||
              !isPaidRemix
            }
            className="w-full rounded-lg bg-[#FF4DA6]/20 px-4 py-2.5 text-sm font-semibold text-[#FF4DA6] hover:bg-[#FF4DA6]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#FF4DA6]/30"
            type="button"
          >
            {isRegistering || currentStep !== "idle" ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Processing...
              </>
            ) : (
              "Buy License & Register Derivative"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LicensingForm;
