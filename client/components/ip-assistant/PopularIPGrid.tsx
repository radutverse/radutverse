import { motion } from "framer-motion";

export interface PopularIP {
  id: string;
  title: string;
  owner: string;
  preview: string;
}

interface PopularIPGridProps {
  onBack: () => void;
}

const DUMMY_IPS: PopularIP[] = [
  {
    id: "1",
    title: "Digital Art Collection",
    owner: "0x742d35Cc6634C0532925a3b844Bc1e8e16d69C65",
    preview: "https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "NFT Series Vol 1",
    owner: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    preview: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Cyberpunk Aesthetics",
    owner: "0x742d35Cc6634C0532925a3b844Bc1e8e16d69C65",
    preview: "https://images.unsplash.com/photo-1569163139394-de4798aa62b3?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Abstract Wonders",
    owner: "0x1234567890123456789012345678901234567890",
    preview: "https://images.unsplash.com/photo-1578621066836-41a655532943?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Pixel Dreams",
    owner: "0x9876543210987654321098765432109876543210",
    preview: "https://images.unsplash.com/photo-1577720643272-265f434a4eda?w=400&h=300&fit=crop",
  },
  {
    id: "6",
    title: "Modern Canvas",
    owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    preview: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop",
  },
];

export const PopularIPGrid = ({ onBack }: PopularIPGridProps) => {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Popular IPs</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 bg-slate-700 hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-600/30"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {DUMMY_IPS.map((ip, index) => (
          <motion.div
            key={ip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group cursor-pointer rounded-lg overflow-hidden bg-slate-800 hover:bg-slate-700 transition-colors duration-200"
          >
            <div className="relative overflow-hidden h-48">
              <img
                src={ip.preview}
                alt={ip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white mb-2 line-clamp-2">
                {ip.title}
              </h3>
              <p className="text-sm text-slate-400">
                Owner: {truncateAddress(ip.owner)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
