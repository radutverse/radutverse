import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("@radix-ui/react-accordion") ||
              id.includes("@radix-ui/react-alert-dialog") ||
              id.includes("@radix-ui/react-dialog") ||
              id.includes("@radix-ui/react-dropdown-menu") ||
              id.includes("@radix-ui/react-hover-card") ||
              id.includes("@radix-ui/react-popover") ||
              id.includes("@radix-ui/react-select") ||
              id.includes("@radix-ui/react-sheet") ||
              id.includes("@radix-ui/react-tabs") ||
              id.includes("@radix-ui/react-toast")
            ) {
              return "vendor-ui";
            }
            if (id.includes("framer-motion")) return "vendor-animation";
            if (id.includes("recharts")) return "vendor-charts";
            if (
              id.includes("date-fns") ||
              id.includes("lucide-react") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor-utils";
            }
            if (
              id.includes("react-hook-form") ||
              id.includes("@hookform/resolvers") ||
              id.includes("zod")
            ) {
              return "vendor-forms";
            }
            if (id.includes("@privy-io/react-auth")) return "vendor-auth";
            if (id.includes("viem") || id.includes("@story-protocol/core-sdk")) {
              return "vendor-web3";
            }
          }
        },
      },
    },
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
