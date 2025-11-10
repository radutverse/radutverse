import { useState } from "react";
import { motion } from "framer-motion";

export interface PopularItem {
  id: string;
  title: string;
  owner: string;
  preview: string;
}

interface PopularIPGridProps {
  onBack: () => void;
}

type Category = "ip" | "image" | "video" | "music";

const DUMMY_DATA: Record<Category, PopularItem[]> = {
  ip: [
    {
      id: "1",
      title: "Digital Art Collection",
      owner: "0x742d35Cc6634C0532925a3b844Bc1e8e16d69C65",
      preview: "https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=300&h=200&fit=crop",
    },
    {
      id: "2",
      title: "NFT Series Vol 1",
      owner: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      preview: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop",
    },
    {
      id: "3",
      title: "Cyberpunk Aesthetics",
      owner: "0x742d35Cc6634C0532925a3b844Bc1e8e16d69C65",
      preview: "https://images.unsplash.com/photo-1569163139394-de4798aa62b3?w=300&h=200&fit=crop",
    },
    {
      id: "4",
      title: "Abstract Wonders",
      owner: "0x1234567890123456789012345678901234567890",
      preview: "https://images.unsplash.com/photo-1578621066836-41a655532943?w=300&h=200&fit=crop",
    },
    {
      id: "5",
      title: "Pixel Dreams",
      owner: "0x9876543210987654321098765432109876543210",
      preview: "https://images.unsplash.com/photo-1577720643272-265f434a4eda?w=300&h=200&fit=crop",
    },
    {
      id: "6",
      title: "Modern Canvas",
      owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      preview: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=300&h=200&fit=crop",
    },
  ],
  image: [
    {
      id: "i1",
      title: "Landscape Photography",
      owner: "0x123456789abcdef123456789abcdef1234567890",
      preview: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
    },
    {
      id: "i2",
      title: "Urban Exploration",
      owner: "0xfedcba9876543210fedcba9876543210fedcba98",
      preview: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=200&fit=crop",
    },
    {
      id: "i3",
      title: "Nature's Beauty",
      owner: "0xabcd1234abcd1234abcd1234abcd1234abcd1234",
      preview: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
    },
    {
      id: "i4",
      title: "Street Art",
      owner: "0x4567890123456789abcdef0123456789abcdef01",
      preview: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=200&fit=crop",
    },
    {
      id: "i5",
      title: "Macro Photography",
      owner: "0x89abcdef89abcdef89abcdef89abcdef89abcdef",
      preview: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
    },
    {
      id: "i6",
      title: "Golden Hour",
      owner: "0xdef123def123def123def123def123def123def1",
      preview: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300&h=200&fit=crop",
    },
  ],
  video: [
    {
      id: "v1",
      title: "Motion Graphics Demo",
      owner: "0x111111111111111111111111111111111111111111",
      preview: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=200&fit=crop",
    },
    {
      id: "v2",
      title: "Cinematic Footage",
      owner: "0x222222222222222222222222222222222222222222",
      preview: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=200&fit=crop",
    },
    {
      id: "v3",
      title: "4K Drone Video",
      owner: "0x333333333333333333333333333333333333333333",
      preview: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop",
    },
    {
      id: "v4",
      title: "Animation Reel",
      owner: "0x444444444444444444444444444444444444444444",
      preview: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=300&h=200&fit=crop",
    },
    {
      id: "v5",
      title: "Music Video",
      owner: "0x555555555555555555555555555555555555555555",
      preview: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    },
    {
      id: "v6",
      title: "Documentary Style",
      owner: "0x666666666666666666666666666666666666666666",
      preview: "https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=300&h=200&fit=crop",
    },
  ],
  music: [
    {
      id: "m1",
      title: "Ambient Soundscape",
      owner: "0x777777777777777777777777777777777777777777",
      preview: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=200&fit=crop",
    },
    {
      id: "m2",
      title: "Electronic Beat",
      owner: "0x888888888888888888888888888888888888888888",
      preview: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop",
    },
    {
      id: "m3",
      title: "Jazz Fusion",
      owner: "0x999999999999999999999999999999999999999999",
      preview: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
    },
    {
      id: "m4",
      title: "Classical Composition",
      owner: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      preview: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&h=200&fit=crop",
    },
    {
      id: "m5",
      title: "Hip Hop Track",
      owner: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      preview: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=200&fit=crop",
    },
    {
      id: "m6",
      title: "Pop Melody",
      owner: "0xcccccccccccccccccccccccccccccccccccccccccc",
      preview: "https://images.unsplash.com/photo-1513320291840-2e0a9bf2a9ae?w=300&h=200&fit=crop",
    },
  ],
};

const CATEGORY_LABELS: Record<Category, string> = {
  ip: "Popular IPs",
  image: "Popular Images",
  video: "Popular Videos",
  music: "Popular Music",
};

export const PopularIPGrid = ({ onBack }: PopularIPGridProps) => {
  const [activeCategory, setActiveCategory] = useState<Category>("ip");
  const [searchQuery, setSearchQuery] = useState("");

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const categories: Category[] = ["ip", "image", "video", "music"];
  const currentItems = DUMMY_DATA[activeCategory];

  const filteredItems = currentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.owner.toLowerCase().includes(searchQuery.toLowerCase())
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

        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700 focus:border-[#FF4DA6] focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
        {currentItems.map((item, index) => (
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
    </motion.div>
  );
};
