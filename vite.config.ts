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
        manualChunks: {
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-sheet",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
          ],
          "vendor-animation": ["framer-motion"],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["date-fns", "lucide-react", "clsx", "tailwind-merge"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-auth": ["@privy-io/react-auth"],
          "vendor-web3": ["viem", "@story-protocol/core-sdk"],
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
