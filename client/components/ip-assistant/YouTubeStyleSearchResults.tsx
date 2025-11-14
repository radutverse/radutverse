import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { SearchResultsGrid } from "@/components/remix-mode/SearchResultsGrid";

interface License {
  licenseTermsId?: string;
  terms?: {
    derivativesAllowed?: boolean;
    [key: string]: any;
  };
  derivativesAllowed?: boolean;
  [key: string]: any;
}

interface SearchResult {
  ipId?: string;
  title?: string;
  name?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  ownerAddress?: string;
  isDerivative?: boolean;
  score?: number;
  licenses?: License[];
  [key: string]: any;
}

interface YouTubeStyleSearchResultsProps {
  searchResults: SearchResult[];
  onClose: () => void;
  onAssetClick: (asset: SearchResult) => void;
  onRemix?: (asset: SearchResult) => void;
  onOwnerClick?: (ownerAddress: string, ownerDomain?: string | null) => void;
  onBackClick?: () => void;
  query?: string;
  displayingOwnerAssets?: boolean;
  ownerDisplay?: string | null;
  isLoadingOwnerAssets?: boolean;
}

export const YouTubeStyleSearchResults = ({
  searchResults,
  onClose,
  onAssetClick,
  onRemix,
  onOwnerClick,
  onBackClick,
  query = "",
  displayingOwnerAssets = false,
  ownerDisplay = null,
  isLoadingOwnerAssets = false,
}: YouTubeStyleSearchResultsProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [ownerDomains, setOwnerDomains] = useState<
    Record<string, { domain: string | null; loading: boolean }>
  >({});
  const domainFetchControllerRef = useRef<AbortController | null>(null);

  // Get unique owner addresses to fetch domains for
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    searchResults.forEach((asset) => {
      if (asset.ownerAddress) {
        owners.add(asset.ownerAddress.toLowerCase());
      }
    });
    return Array.from(owners);
  }, [searchResults]);

  // Fetch domains for all owners when results change
  useEffect(() => {
    if (uniqueOwners.length === 0) {
      console.log("[YouTubeSearchResults] No unique owners found");
      return;
    }

    console.log(
      "[YouTubeSearchResults] Fetching domains for owners:",
      uniqueOwners,
    );

    // Cancel previous domain fetch if still in progress
    if (domainFetchControllerRef.current) {
      domainFetchControllerRef.current.abort();
    }
    domainFetchControllerRef.current = new AbortController();

    // Mark all owners as loading
    const loadingState: Record<
      string,
      { domain: string | null; loading: boolean }
    > = {};
    uniqueOwners.forEach((owner) => {
      loadingState[owner] = { domain: null, loading: true };
    });
    setOwnerDomains(loadingState);

    // Fetch domains for all owners in parallel
    Promise.all(
      uniqueOwners.map((owner) => {
        console.log("[YouTubeSearchResults] Fetching domain for owner:", owner);
        return fetch("/api/resolve-owner-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: owner }),
          signal: domainFetchControllerRef.current?.signal,
        })
          .then((res) => {
            console.log(
              `[YouTubeSearchResults] Response status for ${owner}:`,
              res.status,
            );
            return res.json();
          })
          .then((data) => {
            console.log(
              `[YouTubeSearchResults] Domain data for ${owner}:`,
              data,
            );
            return {
              address: owner,
              domain: data.ok ? data.domain : null,
            };
          })
          .catch((err) => {
            // Don't log errors from aborted requests
            if (err.name !== "AbortError") {
              console.error(
                `[YouTubeSearchResults] Error fetching domain for ${owner}:`,
                err,
              );
            }
            return {
              address: owner,
              domain: null,
            };
          });
      }),
    )
      .then((results) => {
        console.log(
          "[YouTubeSearchResults] All domain fetch results:",
          results,
        );
        const newDomains: Record<
          string,
          { domain: string | null; loading: boolean }
        > = {};
        results.forEach(({ address, domain }) => {
          newDomains[address] = { domain, loading: false };
        });
        setOwnerDomains(newDomains);
      })
      .catch((err) => {
        // Silently ignore abort errors
        if (err.name !== "AbortError") {
          console.error("[YouTubeSearchResults] Error fetching domains:", err);
        }
      });

    return () => {
      if (domainFetchControllerRef.current) {
        domainFetchControllerRef.current.abort();
      }
    };
  }, [uniqueOwners]);

  // Check if asset allows derivatives
  const allowsDerivatives = (asset: SearchResult): boolean => {
    if (!asset.licenses || asset.licenses.length === 0) {
      return false;
    }
    return asset.licenses.some(
      (license) =>
        license.terms?.derivativesAllowed === true ||
        license.derivativesAllowed === true,
    );
  };

  // Get remix types based on licenses (paid/free)
  type RemixTypeInfo = { type: "paid" | "free"; hasAttribution: boolean };
  const getRemixTypes = (asset: SearchResult): RemixTypeInfo[] => {
    if (!asset.licenses || asset.licenses.length === 0) {
      return [];
    }

    const remixTypesMap = new Map<
      "paid" | "free",
      { hasAttribution: boolean }
    >();

    for (const license of asset.licenses) {
      const terms = license.terms || license;
      const derivativesAllowed =
        terms?.derivativesAllowed === true ||
        license.derivativesAllowed === true;

      if (!derivativesAllowed) continue;

      const commercialUse = terms?.commercialUse === true;
      const remixType: "paid" | "free" = commercialUse ? "paid" : "free";

      // Check if this license has derivativesAttribution
      const derivativesAttribution =
        terms?.derivativesAttribution === true ||
        license.derivativesAttribution === true;

      // Update map - set hasAttribution to true if any license of this type requires attribution
      if (!remixTypesMap.has(remixType)) {
        remixTypesMap.set(remixType, {
          hasAttribution: derivativesAttribution,
        });
      } else {
        const existing = remixTypesMap.get(remixType)!;
        existing.hasAttribution =
          existing.hasAttribution || derivativesAttribution;
      }
    }

    return Array.from(remixTypesMap.entries()).map(([type, info]) => ({
      type,
      hasAttribution: info.hasAttribution,
    }));
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-6xl max-h-[90vh] rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/30 px-6 py-4 sm:px-8">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {displayingOwnerAssets && (
              <motion.button
                type="button"
                onClick={onBackClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA6]/30 mt-1"
                aria-label="Back to search results"
                title="Back to search results"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF4DA6] mb-1">
                {displayingOwnerAssets
                  ? "Assets by Owner"
                  : "IP Assets Search Results"}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 truncate">
                {displayingOwnerAssets
                  ? `${ownerDisplay}`
                  : query && `Results for "${query}"`}
                {searchResults.length > 0 && (
                  <span className="ml-2 text-[#FF4DA6] text-lg sm:text-xl">
                    ({searchResults.length})
                  </span>
                )}
              </h2>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-[#FF4DA6]/20 hover:text-[#FF4DA6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA6]/30"
            aria-label="Close search results"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <SearchResultsGrid
            searchResults={searchResults}
            ownerDomains={ownerDomains}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            getRemixTypes={getRemixTypes}
            allowsDerivatives={allowsDerivatives}
            truncateAddressDisplay={(addr) =>
              `${addr.slice(0, 8)}...${addr.slice(-6)}`
            }
            isLoadingOwnerAssets={isLoadingOwnerAssets}
            onAssetClick={onAssetClick}
            onOwnerClick={(ownerAddress, ownerDomain) => {
              if (!displayingOwnerAssets) {
                onOwnerClick?.(ownerAddress, ownerDomain);
              }
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
