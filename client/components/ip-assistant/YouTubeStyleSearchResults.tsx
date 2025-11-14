import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";

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
          {isLoadingOwnerAssets ? (
            <div className="flex items-center justify-center h-full gap-3">
              <div className="w-4 h-4 rounded-full bg-[#FF4DA6] animate-bounce" />
              <span className="text-slate-400">Loading owner assets...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-max">
              {searchResults.map((asset, idx) => (
                <div
                  key={asset.ipId || idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group flex flex-col h-full cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div
                    className="relative w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 hover:-translate-y-1"
                    onClick={() => onAssetClick(asset)}
                  >
                    {asset.mediaUrl ? (
                      asset.mediaType?.startsWith("video") ? (
                        <div className="w-full h-full relative group/video">
                          <video
                            key={asset.ipId}
                            src={asset.mediaUrl}
                            poster={asset.thumbnailUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            playsInline
                          />
                          {/* Play button overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover/video:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/video:opacity-100">
                            <div className="w-16 h-16 rounded-full bg-[#FF4DA6] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                              <svg
                                className="w-8 h-8 text-white fill-current ml-1"
                                viewBox="0 0 24 24"
                              >
                                <path d="M3 3v18h18V3H3zm9 14V7l5 5-5 5z" />
                              </svg>
                            </div>
                          </div>
                          {/* Video badge */}
                          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white">
                            VIDEO
                          </div>
                        </div>
                      ) : asset.mediaType?.startsWith("audio") ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-900/80 via-purple-800/40 to-slate-900 cursor-pointer hover:scale-102 transition-transform">
                          <svg
                            className="w-14 h-14 text-purple-300 hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                          <span className="text-xs text-purple-200 font-semibold">
                            AUDIO
                          </span>
                        </div>
                      ) : (
                        <img
                          src={asset.mediaUrl}
                          alt={asset.title || asset.name || "IP Asset"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onClick={() => onAssetClick(asset)}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const parent = img.parentElement;
                            if (parent && parent.querySelector("img") === img) {
                              img.replaceWith(
                                Object.assign(document.createElement("div"), {
                                  className:
                                    "w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-800",
                                  innerHTML: `
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-xs">Failed to load</span>
                              `,
                                }),
                              );
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-800">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs">No media</span>
                      </div>
                    )}
                    {hoveredIndex === idx && (
                      <div className="absolute inset-0 ring-2 ring-[#FF4DA6]/60 rounded-xl pointer-events-none" />
                    )}

                    {/* Remix Type Badges - Top Right */}
                    {getRemixTypes(asset).length > 0 && (
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {getRemixTypes(asset).map((remixTypeInfo) => (
                          <span
                            key={remixTypeInfo.type}
                            className="text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap backdrop-blur-sm bg-slate-900/80 border"
                            style={{
                              backgroundColor:
                                remixTypeInfo.type === "paid"
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(59, 130, 246, 0.2)",
                              borderColor:
                                remixTypeInfo.type === "paid"
                                  ? "rgb(134, 239, 172)"
                                  : "rgb(147, 197, 253)",
                              color:
                                remixTypeInfo.type === "paid"
                                  ? "rgb(134, 239, 172)"
                                  : "rgb(147, 197, 253)",
                            }}
                          >
                            {remixTypeInfo.type === "paid"
                              ? "💰 Paid"
                              : "🆓 Free"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-4 space-y-2 flex flex-col flex-grow">
                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-[#FF4DA6] transition-colors duration-200">
                      {asset.title || asset.name || "Untitled Asset"}
                    </h3>

                    {/* Badges Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap backdrop-blur-sm transition-all ${
                          asset.isDerivative
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {asset.isDerivative ? "🔄 Remix" : "✨ Original"}
                      </span>

                      {asset.score !== undefined && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#FF4DA6]/20 text-[#FF4DA6] border border-[#FF4DA6]/30 font-semibold whitespace-nowrap backdrop-blur-sm">
                          {(asset.score * 100).toFixed(0)}% Match
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {asset.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                        {asset.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="text-xs text-slate-500 space-y-1">
                      {asset.ownerAddress && (
                        <div className="space-y-1">
                          {/* Owner Domain Display */}
                          {(() => {
                            const ownerLower = asset.ownerAddress.toLowerCase();
                            const domainInfo = ownerDomains[ownerLower];
                            const displayDomain = domainInfo?.domain;
                            const displayText =
                              displayDomain ||
                              `${asset.ownerAddress.slice(0, 8)}...${asset.ownerAddress.slice(-6)}`;

                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (!displayingOwnerAssets) {
                                    e.stopPropagation();
                                    onOwnerClick?.(
                                      asset.ownerAddress,
                                      displayDomain || null,
                                    );
                                  }
                                }}
                                disabled={displayingOwnerAssets}
                                className={`font-mono text-[0.7rem] px-2 py-1 rounded w-fit border transition-all duration-200 ${
                                  displayingOwnerAssets
                                    ? "bg-slate-800/30 text-white border-slate-700/30 cursor-not-allowed opacity-60"
                                    : displayDomain
                                      ? "bg-gradient-to-r from-[#FF4DA6]/20 to-[#FF4DA6]/10 text-[#FF4DA6] border-[#FF4DA6]/30 hover:from-[#FF4DA6]/30 hover:to-[#FF4DA6]/20 hover:border-[#FF4DA6]/50 cursor-pointer hover:scale-105 active:scale-95"
                                      : "bg-slate-800/40 hover:bg-slate-700/40 cursor-pointer hover:scale-105 active:scale-95"
                                }`}
                                title={
                                  displayingOwnerAssets
                                    ? "Click back to search to view other owners"
                                    : `View all assets by ${displayText}`
                                }
                              >
                                {displayText}
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      {asset.mediaType && (
                        <p className="capitalize text-xs text-slate-400">
                          {asset.mediaType
                            .replace("video/", "")
                            .replace("audio/", "")
                            .replace("image/", "")
                            .toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
