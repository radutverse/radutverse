import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader } from "lucide-react";
import { SearchResultsGrid } from "./SearchResultsGrid";
import { ExpandedAssetModal } from "./ExpandedAssetModal";
import {
  useDomainFetch,
  useRemixTypes,
  useAllowsDerivatives,
  useUniqueOwners,
  truncateAddressDisplay,
} from "./hooks";
import type { SearchResult } from "./types";

interface IpImagineSearchProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 20;

export const IpImagineSearch = ({ onBack }: IpImagineSearchProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [lastQueryType, setLastQueryType] = useState<
    "keyword" | "owner" | null
  >(null);
  const [lastResolvedAddress, setLastResolvedAddress] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<SearchResult | null>(null);

  // Custom hooks
  const uniqueOwners = useUniqueOwners(searchResults);
  const ownerDomains = useDomainFetch(uniqueOwners);
  const getRemixTypes = useRemixTypes();
  const allowsDerivatives = useAllowsDerivatives();

  const isIpName = (query: string): boolean => {
    const ipNameRegex = /([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.ip)$/i;
    return ipNameRegex.test(query);
  };

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    setCurrentOffset(0);
    setHasMore(false);

    try {
      // Check if input is .ip name
      if (isIpName(searchInput)) {
        console.log(
          "[IpImagineSearch] Detected .ip name, resolving:",
          searchInput,
        );

        // First resolve the .ip name to address
        const resolveResponse = await fetch("/api/resolve-ip-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ipName: searchInput }),
        });

        if (!resolveResponse.ok) {
          const resolveData = await resolveResponse.json();
          console.error(
            "[IpImagineSearch] Failed to resolve .ip name:",
            resolveData,
          );
          setIsSearching(false);
          return;
        }

        const resolveData = await resolveResponse.json();
        const resolvedAddress = resolveData.address;

        console.log("[IpImagineSearch] Resolved to address:", resolvedAddress);

        setLastResolvedAddress(resolvedAddress);
        setLastQueryType("owner");

        // Search by owner - fetch with pagination
        const searchResponse = await fetch("/api/search-by-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: resolvedAddress }),
        });

        if (!searchResponse.ok) {
          throw new Error("Search by owner failed");
        }

        const searchData = await searchResponse.json();
        const results = searchData.results || [];

        setSearchResults(results.slice(0, ITEMS_PER_PAGE));
        setTotalResults(results.length);
        setCurrentOffset(ITEMS_PER_PAGE);
        setHasMore(results.length > ITEMS_PER_PAGE);
      } else {
        // Regular keyword search - fetch with pagination
        const response = await fetch("/api/search-ip-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchInput,
            pagination: {
              limit: ITEMS_PER_PAGE,
              offset: 0,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        const results = data.results || [];

        setSearchResults(results);
        setTotalResults(data.totalSearched || results.length);
        setCurrentOffset(ITEMS_PER_PAGE);
        setHasMore(data.pagination?.hasMore || results.length > ITEMS_PER_PAGE);
        setLastQueryType("keyword");
      }
    } catch (error) {
      console.error("[IpImagineSearch] Search error:", error);
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchInput]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);

    try {
      if (lastQueryType === "owner") {
        // For owner search, fetch more results
        const searchResponse = await fetch("/api/search-by-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: lastResolvedAddress }),
        });

        if (!searchResponse.ok) {
          throw new Error("Search by owner failed");
        }

        const searchData = await searchResponse.json();
        const allResults = searchData.results || [];
        const newResults = allResults.slice(
          currentOffset,
          currentOffset + ITEMS_PER_PAGE,
        );

        setSearchResults((prev) => [...prev, ...newResults]);
        setCurrentOffset(currentOffset + ITEMS_PER_PAGE);
        setHasMore(currentOffset + ITEMS_PER_PAGE < allResults.length);
      } else {
        // For keyword search, fetch next page
        const response = await fetch("/api/search-ip-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchInput,
            pagination: {
              limit: ITEMS_PER_PAGE,
              offset: currentOffset,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        const newResults = data.results || [];

        setSearchResults((prev) => [...prev, ...newResults]);
        setCurrentOffset(currentOffset + ITEMS_PER_PAGE);
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("[IpImagineSearch] Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentOffset, searchInput, lastQueryType, lastResolvedAddress]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      // Clear search results when input is cleared
      if (!value.trim()) {
        setSearchResults([]);
        setHasSearched(false);
      }
    },
    [],
  );

  const getRemixTypesFunc = useRemixTypes();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Browse & Remix</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 bg-slate-700 hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-600/30"
        >
          ← Back
        </button>
      </div>

      <div className="relative flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="px-4 py-2 pr-10 rounded-lg bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700 focus:border-[#FF4DA6] focus:outline-none transition-colors flex-1"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 rounded-lg bg-[#FF4DA6] text-white font-semibold hover:bg-[#FF4DA6]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>

      {hasSearched ? (
        <div className="w-full flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <>
              <SearchResultsGrid
                searchResults={searchResults}
                ownerDomains={ownerDomains}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
                getRemixTypes={getRemixTypes}
                allowsDerivatives={allowsDerivatives}
                truncateAddressDisplay={truncateAddressDisplay}
                isLoadingOwnerAssets={false}
                onAssetClick={(asset) => setExpandedAsset(asset)}
                onOwnerClick={() => {}}
              />

              {hasMore && (
                <div className="flex justify-center pt-8 pb-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="text-sm text-[#FF4DA6] hover:text-[#FF4DA6]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load more</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-slate-500 mb-3" />
              <p className="text-slate-300 text-sm">No results found</p>
              <p className="text-slate-500 text-xs mt-1">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <p>Start searching for IP assets</p>
        </div>
      )}

      {/* Expanded Asset Details Modal */}
      <AnimatePresence>
        {expandedAsset ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
              onClick={() => setExpandedAsset(null)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />

            <motion.div
              className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-950/95 border border-slate-800/50 shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.24 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-start justify-between gap-4 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/30 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-100 line-clamp-2">
                    {expandedAsset.title ||
                      expandedAsset.name ||
                      "Untitled Asset"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedAsset(null)}
                  className="flex-shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-[#FF4DA6]/20 hover:text-[#FF4DA6] focus:outline-none"
                  aria-label="Close asset details"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Media Display */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 aspect-video flex items-center justify-center p-4">
                  {expandedAsset.mediaType?.startsWith("video") ? (
                    <video
                      src={expandedAsset.mediaUrl}
                      poster={expandedAsset.thumbnailUrl}
                      controls
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : expandedAsset.mediaType?.startsWith("audio") ? (
                    <div className="flex flex-col items-center gap-4">
                      <svg
                        className="w-16 h-16 text-slate-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v9.28c-.47-.46-1.12-.75-1.84-.75-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                      <audio
                        src={expandedAsset.mediaUrl}
                        controls
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <img
                      src={expandedAsset.mediaUrl}
                      alt={
                        expandedAsset.title || expandedAsset.name || "IP Asset"
                      }
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.replaceWith(
                          Object.assign(document.createElement("div"), {
                            className:
                              "flex flex-col items-center justify-center gap-2 text-slate-400 w-full h-full",
                            innerHTML: `
                              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-sm">Failed to load media</span>
                            `,
                          }),
                        );
                      }}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="border-t border-slate-800/30 bg-slate-950/95 px-6 py-6 space-y-6">
                  {expandedAsset.description && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {expandedAsset.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div>
                      <span
                        className={`text-xs px-3 py-2 rounded-full font-semibold whitespace-nowrap backdrop-blur-sm border ${
                          expandedAsset.isDerivative
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {expandedAsset.isDerivative
                          ? "🔄 Remix"
                          : "✨ Original"}
                      </span>
                    </div>

                    {expandedAsset.score !== undefined && (
                      <span className="text-xs px-3 py-2 rounded-full bg-[#FF4DA6]/20 text-[#FF4DA6] border border-[#FF4DA6]/30 font-semibold whitespace-nowrap backdrop-blur-sm">
                        {(expandedAsset.score * 100).toFixed(0)}% Match
                      </span>
                    )}

                    {expandedAsset.mediaType && (
                      <span className="text-xs text-slate-400">
                        {expandedAsset.mediaType
                          ?.replace("video/", "")
                          .replace("audio/", "")
                          .replace("image/", "")
                          .toUpperCase()}
                      </span>
                    )}

                    {expandedAsset.ownerAddress && (
                      <div className="text-xs">
                        <span className="text-slate-500">Owner:</span>
                        <span className="text-slate-200 font-mono ml-2">
                          {expandedAsset.ownerAddress.slice(0, 8)}...
                          {expandedAsset.ownerAddress.slice(-6)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remix Types */}
                  {getRemixTypesFunc(expandedAsset).length > 0 && (
                    <div className="pt-4 border-t border-slate-800/30">
                      <p className="text-xs text-slate-400 font-semibold mb-3">
                        Remix Types:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getRemixTypesFunc(expandedAsset).map((remixConfig) => (
                          <span
                            key={remixConfig.type}
                            className="text-xs px-3 py-2 rounded-full font-semibold whitespace-nowrap backdrop-blur-sm border"
                            style={{
                              backgroundColor:
                                remixConfig.type === "paid"
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(59, 130, 246, 0.2)",
                              borderColor:
                                remixConfig.type === "paid"
                                  ? "rgb(134, 239, 172)"
                                  : "rgb(147, 197, 253)",
                              color:
                                remixConfig.type === "paid"
                                  ? "rgb(134, 239, 172)"
                                  : "rgb(147, 197, 253)",
                            }}
                          >
                            {remixConfig.type === "paid"
                              ? "💰 Paid"
                              : "🆓 Free"}
                            {remixConfig.hasAttribution && " • Attribution"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
