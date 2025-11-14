import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader } from "lucide-react";
import type { PopularItem } from "./types";
import type { SearchResult } from "./types";

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
  const [allSearchResults, setAllSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);

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
    setAllSearchResults([]);
    setCurrentOffset(0);

    try {
      // Check if input is .ip name
      if (isIpName(searchInput)) {
        console.log("[PopularIPGrid] Detected .ip name, resolving:", searchInput);

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

        // Search by owner
        const searchResponse = await fetch("/api/search-by-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: resolvedAddress }),
        });

        if (!searchResponse.ok) {
          throw new Error("Search by owner failed");
        }

        const searchData = await searchResponse.json();
        const allResults = searchData.results || [];

        setAllSearchResults(allResults);
        setSearchResults(allResults.slice(0, ITEMS_PER_PAGE));
        setCurrentOffset(ITEMS_PER_PAGE);
      } else {
        // Regular keyword search
        const response = await fetch("/api/search-ip-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchInput,
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        const allResults = data.results || [];

        setAllSearchResults(allResults);
        setSearchResults(allResults.slice(0, ITEMS_PER_PAGE));
        setCurrentOffset(ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setAllSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchInput]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);

    setTimeout(() => {
      const newOffset = currentOffset + ITEMS_PER_PAGE;
      const newResults = allSearchResults.slice(currentOffset, newOffset);

      setSearchResults((prev) => [...prev, ...newResults]);
      setCurrentOffset(newOffset);
      setIsLoadingMore(false);
    }, 300);
  }, [currentOffset, allSearchResults]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear search results when input is cleared
    if (!value.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, []);

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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                {searchResults.map((item, index) => (
                  <motion.div
                    key={item.ipId || `${item.name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group cursor-pointer rounded-lg overflow-hidden bg-slate-800 hover:bg-slate-700 transition-colors duration-200"
                  >
                    <div className="relative overflow-hidden h-24">
                      {item.mediaUrl || item.thumbnailUrl ? (
                        <img
                          src={item.mediaUrl || item.thumbnailUrl}
                          alt={item.name || "Asset"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <span className="text-xs text-slate-400">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h3 className="font-semibold text-white mb-1 line-clamp-2 text-xs">
                        {item.name || "Unnamed Asset"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {item.ownerAddress
                          ? truncateAddress(item.ownerAddress)
                          : "Unknown"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {currentOffset < totalResults && (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More ({currentOffset} / {totalResults})</span>
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
