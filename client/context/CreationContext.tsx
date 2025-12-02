import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ResultType } from "@/types/generation";

export interface Creation {
  id: string;
  url: string;
  type: ResultType;
  timestamp: number;
  prompt: string;
  isDemo?: boolean;
  remixType?: "paid" | "free" | null;
  parentAsset?: any;
  originalUrl?: string;
  registeredByWallet?: string;
  registeredIpId?: string;
}

interface CreationContextType {
  resultUrl: string | null;
  setResultUrl: (url: string | null) => void;
  resultType: ResultType;
  setResultType: (type: ResultType) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  creations: Creation[];
  addCreation: (
    url: string,
    type: ResultType,
    prompt: string,
    isDemo?: boolean,
    remixType?: "paid" | "free" | null,
    parentAsset?: any,
    originalUrl?: string,
  ) => void;
  updateCreationWithOriginalUrl: (
    id: string,
    originalUrl: string,
    registeredByWallet?: string,
    registeredIpId?: string,
  ) => void;
  getRegisteredIpIdsForWallet: (walletAddress: string) => string[];
  isCreationUnlockedByWallet: (
    creationId: string,
    walletAddress: string,
  ) => boolean;
  removeCreation: (id: string) => void;
  clearCreations: () => void;
  originalPrompt: string;
  setOriginalPrompt: (prompt: string) => void;
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  setUserIdentifier: (walletAddress: string | null, isGuest: boolean) => void;
}

export const CreationContext = createContext<CreationContextType | undefined>(
  undefined,
);

const RESULT_URL_KEY = "current_result_url";
const RESULT_TYPE_KEY = "current_result_type";
const ORIGINAL_PROMPT_KEY = "original_prompt";
const DEMO_MODE_KEY = "demo_mode";

// Helper to generate user-specific blob key
const getUserBlobKey = (
  walletAddress: string | null,
  isGuest: boolean,
): string => {
  if (isGuest) {
    return "creation-history-guest.json";
  }
  if (walletAddress) {
    // Replace hyphens with underscores to avoid blob key issues
    const sanitized = walletAddress.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `creation-history-${sanitized}.json`;
  }
  return "creation-history-guest.json";
};

export const CreationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);
  const [isGuest, setIsGuestState] = useState<boolean>(false);

  // Load creations from Vercel Blob based on user identifier
  useEffect(() => {
    const loadCreations = async () => {
      try {
        const blobKey = getUserBlobKey(walletAddress, isGuest);
        const response = await fetch("/api/get-creation-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobKey }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.creations && data.creations.length > 0) {
            const nonDemoCreations = data.creations.filter(
              (c: Creation) => !c.isDemo,
            );
            console.log(
              `[CreationContext] Loaded ${nonDemoCreations.length} creations from Vercel Blob (${blobKey}):`,
              nonDemoCreations.map((c: Creation) => ({
                id: c.id,
                hasOriginalUrl: !!c.originalUrl,
                registeredByWallet: c.registeredByWallet,
                registeredIpId: c.registeredIpId,
              })),
            );
            setCreations(nonDemoCreations);
          }
        }
      } catch (error) {
        console.warn(
          "[CreationContext] Failed to load from Vercel Blob:",
          error,
        );
      }
    };

    loadCreations();

    const storedResultUrl = localStorage.getItem(RESULT_URL_KEY);
    const storedResultType = localStorage.getItem(RESULT_TYPE_KEY);
    const storedPrompt = localStorage.getItem(ORIGINAL_PROMPT_KEY);
    const storedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
    if (storedResultUrl) {
      setResultUrl(storedResultUrl);
    }
    if (storedResultType) {
      setResultType(storedResultType as ResultType);
    }
    if (storedPrompt) {
      setOriginalPrompt(storedPrompt);
    }
    if (storedDemoMode !== null) {
      setDemoMode(JSON.parse(storedDemoMode));
    }
  }, [walletAddress, isGuest]);

  // Sync creation history to Vercel Blob with user-specific key
  const syncToBlob = useCallback(
    async (creationsToSync: Creation[]) => {
      try {
        const blobKey = getUserBlobKey(walletAddress, isGuest);
        const response = await fetch("/api/sync-creation-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creations: creationsToSync, blobKey }),
        });

        if (!response.ok) {
          console.warn(
            `[CreationContext] Blob sync failed: ${response.status}`,
          );
          return;
        }

        const data = await response.json();
        console.log("[CreationContext] Synced to Vercel Blob:", {
          count: data.synced,
          lastSynced: new Date(data.lastSynced).toLocaleString(),
          blobKey,
        });
      } catch (error) {
        console.warn("[CreationContext] Blob sync error:", error);
        // Don't let sync errors affect UX
      }
    },
    [walletAddress, isGuest],
  );

  // Sync creations to Vercel Blob whenever they change (only non-demo)
  useEffect(() => {
    const nonDemoCreations = creations.filter((c) => !c.isDemo);
    console.log(
      `[CreationContext] Syncing ${nonDemoCreations.length} creations to Vercel Blob:`,
      nonDemoCreations.map((c) => ({
        id: c.id,
        hasOriginalUrl: !!c.originalUrl,
        registeredByWallet: c.registeredByWallet,
        registeredIpId: c.registeredIpId,
      })),
    );

    syncToBlob(nonDemoCreations);
  }, [creations, syncToBlob]);

  // Save current result URL to localStorage (only non-demo)
  useEffect(() => {
    const lastNonDemoResult = creations.find((c) => !c.isDemo);
    if (lastNonDemoResult?.url) {
      localStorage.setItem(RESULT_URL_KEY, lastNonDemoResult.url);
    } else if (!resultUrl?.includes("data:")) {
      // Only persist non-data URLs to localStorage
      if (resultUrl) {
        localStorage.setItem(RESULT_URL_KEY, resultUrl);
      } else {
        localStorage.removeItem(RESULT_URL_KEY);
      }
    }
  }, [resultUrl, creations]);

  // Save current result type to localStorage (only for non-demo)
  useEffect(() => {
    const lastNonDemoResult = creations.find((c) => !c.isDemo);
    if (lastNonDemoResult?.type) {
      localStorage.setItem(RESULT_TYPE_KEY, lastNonDemoResult.type);
    } else if (resultType) {
      localStorage.setItem(RESULT_TYPE_KEY, resultType);
    } else {
      localStorage.removeItem(RESULT_TYPE_KEY);
    }
  }, [resultType, creations]);

  // Save original prompt to localStorage
  useEffect(() => {
    if (originalPrompt) {
      localStorage.setItem(ORIGINAL_PROMPT_KEY, originalPrompt);
    } else {
      localStorage.removeItem(ORIGINAL_PROMPT_KEY);
    }
  }, [originalPrompt]);

  // Save demo mode to localStorage
  useEffect(() => {
    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoMode));
  }, [demoMode]);

  useEffect(() => {
    return () => {
      if (resultUrl && resultUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const addCreation = useCallback(
    (
      url: string,
      type: ResultType,
      prompt: string,
      isDemo: boolean = false,
      remixType?: "paid" | "free" | null,
      parentAsset?: any,
      originalUrl?: string,
    ) => {
      const now = Date.now();
      const newCreation: Creation = {
        id: `creation_${now}`,
        url,
        type,
        timestamp: now,
        prompt,
        isDemo,
        remixType,
        parentAsset,
        originalUrl,
      };
      setCreations((prev) => [newCreation, ...prev]);

      // Auto-remove demo creations after 6 minutes (360000ms)
      if (isDemo) {
        const timeoutId = setTimeout(() => {
          setCreations((prev) => prev.filter((c) => c.id !== newCreation.id));
        }, 360000);

        return () => clearTimeout(timeoutId);
      }
    },
    [],
  );

  const updateCreationWithOriginalUrl = useCallback(
    (
      id: string,
      originalUrl: string,
      registeredByWallet?: string,
      registeredIpId?: string,
    ) => {
      console.log(`[CreationContext] updateCreationWithOriginalUrl called:`, {
        id,
        originalUrl: originalUrl ? "provided" : "missing",
        registeredByWallet,
        registeredIpId,
      });
      setCreations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, originalUrl, registeredByWallet, registeredIpId }
            : c,
        ),
      );
    },
    [],
  );

  const getRegisteredIpIdsForWallet = useCallback(
    (walletAddress: string): string[] => {
      return creations
        .filter(
          (c) =>
            c.registeredByWallet?.toLowerCase() ===
              walletAddress?.toLowerCase() && c.registeredIpId,
        )
        .map((c) => c.registeredIpId!)
        .filter(Boolean);
    },
    [creations],
  );

  const isCreationUnlockedByWallet = useCallback(
    (creationId: string, walletAddress: string): boolean => {
      const creation = creations.find((c) => c.id === creationId);
      if (!creation || !creation.registeredByWallet) return false;
      return (
        creation.registeredByWallet.toLowerCase() ===
          walletAddress?.toLowerCase() && !!creation.originalUrl
      );
    },
    [creations],
  );

  const removeCreation = useCallback((id: string) => {
    setCreations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCreations = useCallback(() => {
    setCreations([]);
  }, []);

  const setUserIdentifier = useCallback(
    (walletAddr: string | null, guestMode: boolean) => {
      console.log(
        `[CreationContext] User identifier changed: wallet=${walletAddr}, guest=${guestMode}`,
      );
      setWalletAddressState(walletAddr);
      setIsGuestState(guestMode);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      resultUrl,
      setResultUrl,
      resultType,
      setResultType,
      isLoading,
      setIsLoading,
      loadingMessage,
      setLoadingMessage,
      error,
      setError,
      creations,
      addCreation,
      updateCreationWithOriginalUrl,
      getRegisteredIpIdsForWallet,
      isCreationUnlockedByWallet,
      removeCreation,
      clearCreations,
      originalPrompt,
      setOriginalPrompt,
      demoMode,
      setDemoMode,
      setUserIdentifier,
    }),
    [
      resultUrl,
      resultType,
      isLoading,
      loadingMessage,
      error,
      creations,
      addCreation,
      updateCreationWithOriginalUrl,
      getRegisteredIpIdsForWallet,
      isCreationUnlockedByWallet,
      removeCreation,
      clearCreations,
      originalPrompt,
      demoMode,
      setUserIdentifier,
    ],
  ) as CreationContextType;

  return (
    <CreationContext.Provider value={contextValue}>
      {children}
    </CreationContext.Provider>
  );
};
