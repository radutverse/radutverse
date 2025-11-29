import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
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
import { keccakOfJson } from "@/lib/utils/crypto";

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
    | "idle"
    | "minting-license"
    | "registering-child"
    | "registering-derivative"
    | "success"
  >("idle");

  // Check if this is a paid remix with parent asset
  const isPaidRemix = parentAsset && parentAsset.licenses?.length > 0;
  const parentLicense = isPaidRemix
    ? parentAsset.licenses.find((l: any) => l.terms?.commercialUse === true)
    : null;

  // Get parent's revenue share (read-only, must match parent)
  // Convert from scaled format (1000000 = 1%) to percentage (0-100)
  const parentRevShareScaled = parentLicense?.terms?.commercialRevShare ?? 0;
  const parentRevShare = Number(parentRevShareScaled) / 1000000;

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

      const rpcUrl = (import.meta as any).env?.VITE_PUBLIC_STORY_RPC;
      if (!rpcUrl) throw new Error("RPC URL not set");

      // Setup Story Client
      let storyClient: any;
      if (ethProvider) {
        storyClient = StoryClient.newClient({
          account: addr as any,
          transport: custom(ethProvider),
          chainId: 1514,
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
          chainId: 1514,
        });
      }

      // ========================================
      // STEP 1: MINT LICENSE TOKEN FROM PARENT
      // ========================================
      console.log("🎟️ Step 1: Minting license token from parent IP...");
      setCurrentStep("minting-license");
      if (onRegisterStart) {
        onRegisterStart({
          status: "Minting license token from parent IP...",
          progress: 20,
          error: null,
        });
      }

      const licenseTermsId = parentLicense.licenseTermsId;
      const mintTx = await storyClient.license.mintLicenseTokens({
        licensorIpId: parentAsset.ipId as `0x${string}`,
        licenseTermsId,
        amount: 1,
        receiver: addr as `0x${string}`,
        maxMintingFee: "0",
        maxRevenueShare: 100,
      });

      const licenseTokenId = Number(mintTx.licenseTokenIds[0]);
      console.log("✅ License token minted:", licenseTokenId, mintTx);

      // ========================================
      // STEP 2: CREATE CHILD NFT & REGISTER IP
      // ========================================
      console.log("📸 Step 2: Creating child NFT and registering IP...");
      setCurrentStep("registering-child");
      if (onRegisterStart) {
        onRegisterStart({
          status: "Creating child NFT and registering IP asset...",
          progress: 40,
          error: null,
        });
      }

      const file = await handleConvertImageToFile();

      // Upload image to IPFS
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image to IPFS");
      }

      const { url: imageUri } = await uploadRes.json();

      // Mint NFT and register IP
      const spg = (import.meta as any).env?.VITE_PUBLIC_SPG_COLLECTION;
      if (!spg) throw new Error("SPG collection not configured");

      // Create metadata objects for IP and NFT
      const ipMetadataObj = {
        title: title || "AI Generated Image",
        description:
          description || "Created using AI image generation technology",
        ipType: "Image",
        createdAt: new Date().toISOString(),
        mediaUrl: imageUri,
      };

      const nftMetadataObj = {
        title: title || "AI Generated Image",
        description:
          description || "Created using AI image generation technology",
        image: imageUri,
        attributes: [
          {
            trait_type: "Type",
            value: "AI Generated Derivative",
          },
          {
            trait_type: "Parent IP",
            value: parentAsset?.ipId || "Unknown",
          },
        ],
      };

      // Calculate hashes for metadata
      const ipMetadataHash = keccakOfJson(ipMetadataObj);
      const nftMetadataHash = keccakOfJson(nftMetadataObj);

      const { ipId: childIpId, txHash: registerTxHash } =
        await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: spg as `0x${string}`,
          recipient: addr as `0x${string}`,
          ipMetadata: {
            ipMetadataURI: imageUri,
            ipMetadataHash: ipMetadataHash as `0x${string}`,
            nftMetadataURI: imageUri,
            nftMetadataHash: nftMetadataHash as `0x${string}`,
          },
          licenseTermsData: [
            {
              terms: PILFlavor.commercialRemix({
                commercialRevShare: Math.min(100, Math.max(0, parentRevShare)),
                defaultMintingFee: parseEther("0"),
                currency: WIP_TOKEN_ADDRESS,
              }),
            },
          ],
          allowDuplicates: true,
        });

      console.log("✅ Child IP registered:", childIpId);

      // ========================================
      // STEP 3: REGISTER DERIVATIVE (FIXED!)
      // ========================================
      console.log("🔗 Step 3: Registering derivative with license token...");
setCurrentStep("registering-derivative");
if (onRegisterStart) {
  onRegisterStart({
    status: "Registering derivative IP asset...",
    progress: 70,
    error: null,
  });
}

// SOLUSI: Pakai registerDerivativeIp dengan derivData.licenseTokenIds
// JANGAN pakai registerDerivativeWithLicenseTokens karena ada bug dengan parameter
const derivativeTx = await storyClient.ipAsset.registerDerivativeIp({
  childIpId: childIpId as `0x${string}`,
  derivData: {
    parentIpIds: [parentAsset.ipId as `0x${string}`],
    licenseTokenIds: [BigInt(licenseTokenId)], // Convert ke BigInt
  },
  txOptions: { waitForTransaction: true }
});

console.log("🎉 Derivative registered:", derivativeTx);

setCurrentStep("success");
setRegisteredIpId(childIpId);
setRegisterSuccess(true);
setSuccessMessage(
  demoMode
    ? `✅ Derivative registered! Child IP: ${childIpId}`
    : `✅ Derivative registered with ${parentRevShare}% revenue share. Child IP: ${childIpId}`,
);

if (onRegisterComplete) {
  onRegisterComplete({
    ipId: childIpId,
    txHash: derivativeTx?.txHash || registerTxHash,
  });
}
