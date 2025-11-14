import { useState } from "react";
import { motion } from "framer-motion";

type Category = "ip" | "image" | "video" | "music";

interface PopularItem {
  id: string;
  title: string;
  owner: string;
  preview: string;
}

interface CategoryBrowserProps {
  items: Record<Category, PopularItem[]>;
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  ip: "Iconic IPs",
  image: "Popular Images",
  video: "Popular Videos",
  music: "Popular Music",
};

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const CategoryBrowser = ({
  items,
  activeCategory,
  onCategoryChange
}: CategoryBrowserProps) => {
  const categories: Category[] = ["ip", "image", "video", "music"];
  const currentItems = items[activeCategory];

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
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

      {activeCategory === "ip" ? (
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
    </div>
  );
};
