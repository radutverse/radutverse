import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const isDev =
  process.env.NODE_ENV === "development" || process.argv.includes("--dev");

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },

  // IMPORTANT: prevent Vite from bundling backend
  optimizeDeps: {
    exclude: ["server"],
  },

  ssr: {
    noExternal: ["server"],
  },

  build: {
    outDir: "dist/spa",
    rollupOptions: {
      input: "client/index.html", // ensure only client builds
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
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
          ],
          "vendor-animation": ["framer-motion"],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["date-fns", "lucide-react", "clsx"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },

  plugins: [expressPlugin(), react()],

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
    apply: "serve",
    async configureServer(server) {
      const { createServer } = await import("./server/index.js");
      const app = await createServer();
      server.middlewares.use(app);
    },
  };
}
