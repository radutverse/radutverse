import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader } from "lucide-react";
import type { PopularItem, SearchResult } from "./types";

interface PopularIPGridProps {
  onBack: () => void;
}

type Category = "ip" | "image" | "video" | "music";

const DUMMY_DATA: Record<Category, PopularItem[]> = {
  ip: [
    {
      id: "ippy-bg",
      title: "Ippy Background",
      owner: "Radut",
      preview:
        "https://cdn.builder.io/api/v1/image/assets%2F01304b38e2b147e0ab91328119e9a69b%2F2e3c90e4481c48f69e5c39498a60f29e?format=webp&width=800",
    },
  ],
  image: [
    {
      id: "i1",
      title: "Landscape Photography",
      owner: "0x123456789abcdef123456789abcdef1234567890",
      preview:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
    },
    {
      id: "i2",
      title: "Urban Exploration",
      owner: "0xfedcba9876543210fedcba9876543210fedcba98",
      preview:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=200&fit=crop",
    },
    {
      id: "i3",
      title: "Nature's Beauty",
      owner: "0xabcd1234abcd1234abcd1234abcd1234abcd1234",
      preview:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
    },
    {
      id: "i4",
      title: "Street Art",
      owner: "0x4567890123456789abcdef0123456789abcdef01",
      preview:
        "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=200&fit=crop",
    },
    {
      id: "i5",
      title: "Macro Photography",
      owner: "0x89abcdef89abcdef89abcdef89abcdef89abcdef",
      preview:
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
    },
    {
      id: "i6",
      title: "Golden Hour",
      owner: "0xdef123def123def123def123def123def123def1",
      preview:
        "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300&h=200&fit=crop",
    },
  ],
  video: [
    {
      id: "v1",
      title: "Motion Graphics Demo",
      owner: "0x111111111111111111111111111111111111111111",
      preview:
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=200&fit=crop",
    },
    {
      id: "v2",
      title: "Cinematic Footage",
      owner: "0x222222222222222222222222222222222222222222",
      preview:
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=200&fit=crop",
    },
    {
      id: "v3",
      title: "4K Drone Video",
      owner: "0x333333333333333333333333333333333333333333",
      preview:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop",
    },
    {
      id: "v4",
      title: "Animation Reel",
      owner: "0x444444444444444444444444444444444444444444",
      preview:
        "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=300&h=200&fit=crop",
    },
    {
      id: "v5",
      title: "Music Video",
      owner: "0x555555555555555555555555555555555555555555",
      preview:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    },
    {
      id: "v6",
      title: "Documentary Style",
      owner: "0x666666666666666666666666666666666666666666",
      preview:
        "https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=300&h=200&fit=crop",
    },
  ],
  music: [
    {
      id: "m1",
      title: "Ambient Soundscape",
      owner: "0x777777777777777777777777777777777777777777",
      preview:
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=200&fit=crop",
    },
    {
      id: "m2",
      title: "Electronic Beat",
      owner: "0x888888888888888888888888888888888888888888",
      preview:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop",
    },
    {
      id: "m3",
      title: "Jazz Fusion",
      owner: "0x999999999999999999999999999999999999999999",
      preview:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
    },
    {
      id: "m4",
      title: "Classical Composition",
      owner: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      preview:
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&h=200&fit=crop",
    },
    {
      id: "m5",
      title: "Hip Hop Track",
      owner: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      preview:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=200&fit=crop",
    },
    {
      id: "m6",
      title: "Pop Melody",
      owner: "0xcccccccccccccccccccccccccccccccccccccccccc",
      preview:
        "https://images.unsplash.com/photo-1513320291840-2e0a9bf2a9ae?w=300&h=200&fit=crop",
    },
  ],
};

const CATEGORY_LABELS: Record<Category, string> = {
  ip: "Iconic IPs",
  image: "Popular Images",
  video: "Popular Videos",
  music: "Popular Music",
};

export const PopularIPGrid = ({ onBack }: PopularIPGridProps) => {
  const [activeCategory, setActiveCategory] = useState<Category>("ip");
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [ownerDomains, setOwnerDomains] = useState<
    Record<string, { domain: string | null; loading: boolean }>
  >({});
  const domainFetchControllerRef = useRef<AbortController | null>(null);

  const ITEMS_PER_PAGE = 20;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
          "[PopularIPGrid] Detected .ip name, resolving:",
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
          console.error("Failed to resolve .ip name:", resolveData);
          setIsSearching(false);
          return;
        }

        const resolveData = await resolveResponse.json();
        const resolvedAddress = resolveData.address;

        console.log("[PopularIPGrid] Resolved to address:", resolvedAddress);

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
        setHasMore(
          data.pagination?.hasMore || results.length >= ITEMS_PER_PAGE,
        );
        setLastQueryType("keyword");
      }
    } catch (error) {
      console.error("Search error:", error);
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
      console.error("Load more error:", error);
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
      return;
    }

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
        return fetch("/api/resolve-owner-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: owner }),
          signal: domainFetchControllerRef.current?.signal,
        })
          .then((res) => res.json())
          .then((data) => {
            return {
              address: owner,
              domain: data.ok ? data.domain : null,
            };
          })
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.error("Error fetching domain:", err);
            }
            return {
              address: owner,
              domain: null,
            };
          });
      }),
    )
      .then((results) => {
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
        if (err.name !== "AbortError") {
          console.error("Error fetching domains:", err);
        }
      });

    return () => {
      if (domainFetchControllerRef.current) {
        domainFetchControllerRef.current.abort();
      }
    };
  }, [uniqueOwners]);

  const truncateAddressDisplay = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const allowsDerivatives = (asset: SearchResult): boolean => {
    if (!asset.licenses || asset.licenses.length === 0) {
      return false;
    }
    return asset.licenses.some(
      (license: any) =>
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

  const categories: Category[] = ["ip", "image", "video", "music"];
  const currentItems = DUMMY_DATA[activeCategory];

  const filteredItems = currentItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-[#FF4DA6] text-white shadow-lg shadow-[#FF4DA6]/30"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="relative flex gap-2">
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
      </div>

      {hasSearched ? (
        <div className="w-full">
          {searchResults.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-max pb-4">
                {searchResults.map((asset, idx) => {
                  const ownerLower = asset.ownerAddress?.toLowerCase() || "";
                  const domainInfo = ownerDomains[ownerLower];
                  const displayDomain = domainInfo?.domain;
                  const displayText =
                    displayDomain ||
                    (asset.ownerAddress
                      ? truncateAddressDisplay(asset.ownerAddress)
                      : "Unknown");
                  const remixTypes = getRemixTypes(asset);

                  return (
                    <motion.div
                      key={asset.ipId || `${asset.name}-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="group flex flex-col h-full cursor-pointer"
                    >
                      {/* Thumbnail Container with aspect video */}
                      <div
                        className="relative w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 hover:-translate-y-1"
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
                        {remixTypes.length > 0 && (
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {remixTypes.map((remixTypeInfo) => (
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
                              <button
                                type="button"
                                className="font-mono text-[0.7rem] px-2 py-1 rounded w-fit border transition-all duration-200 bg-gradient-to-r from-[#FF4DA6]/20 to-[#FF4DA6]/10 text-[#FF4DA6] border-[#FF4DA6]/30 hover:from-[#FF4DA6]/30 hover:to-[#FF4DA6]/20 hover:border-[#FF4DA6]/50 cursor-pointer hover:scale-105 active:scale-95"
                                title={`View all assets by ${displayText}`}
                              >
                                {displayText}
                              </button>
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

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-700/30">
                          <button
                            type="button"
                            className="flex-1 text-xs px-2 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-medium transition-all duration-200 active:scale-95"
                            title="View details"
                          >
                            Detail
                          </button>
                          {allowsDerivatives(asset) && (
                            <button
                              type="button"
                              className="flex-1 text-xs px-2 py-2 rounded-lg bg-[#FF4DA6]/20 hover:bg-[#FF4DA6]/30 text-[#FF4DA6] font-medium transition-all duration-200 active:scale-95"
                              title="Remix this asset"
                            >
                              Remix
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="text-sm text-[#FF4DA6] hover:text-[#FF4DA6]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader className="h-3 w-3 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load more</span>
                    )}
                  </button>
                </div>
              )}
            </div>
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
      ) : activeCategory === "ip" ? (
        <div className="w-full">
          {filteredItems[0] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden bg-slate-800"
            >
              <img
                src={filteredItems[0].preview}
                alt={filteredItems[0].title}
                className="w-full h-[180px] sm:h-[220px] md:h-[280px] object-cover"
              />

              <div className="absolute left-6 top-6 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {filteredItems[0].title.replace(/\s+Background$/i, "")}
                  </h3>
                  <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                    IP
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-200">by Story</div>
                <button
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/90 text-slate-900 px-4 py-2 text-sm font-semibold shadow"
                >
                  View Catalog
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group cursor-pointer rounded-lg overflow-hidden bg-slate-800 hover:bg-slate-700 transition-colors duration-200"
            >
              <div className="relative overflow-hidden h-24">
                <img
                  src={item.preview}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2">
                <h3 className="font-semibold text-white mb-1 line-clamp-2 text-xs">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {truncateAddress(item.owner)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isCatalogModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsCatalogModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 rounded-lg p-6 w-[90%] max-w-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Catalog</h3>
                <button
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "https://cdn.builder.io/api/v1/image/assets%2F01304b38e2b147e0ab91328119e9a69b%2Fd908ae6baae64d819c4a9f0eec438149?format=webp&width=800",
                  "https://cdn.builder.io/api/v1/image/assets%2F01304b38e2b147e0ab91328119e9a69b%2Fd05ab18fd4264ebc9adf6c8e6fa7c661?format=webp&width=800",
                  "https://cdn.builder.io/api/v1/image/assets%2F01304b38e2b147e0ab91328119e9a69b%2F4e6a253681954d7d9004a504916eeddc?format=webp&width=800",
                  "https://cdn.builder.io/api/v1/image/assets%2F01304b38e2b147e0ab91328119e9a69b%2Ff5b6eb4c6bf441249e51c4b5ef88c092?format=webp&width=800",
                ].map((src, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center aspect-square"
                  >
                    <img
                      src={src}
                      alt={`catalog-${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
