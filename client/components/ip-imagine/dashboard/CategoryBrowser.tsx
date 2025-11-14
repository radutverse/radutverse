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
  activeCategory,
  onCategoryChange
}: Omit<CategoryBrowserProps, 'items'>) => {
  const categories: Category[] = ["ip", "image", "video", "music"];

  return (
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
  );
};
