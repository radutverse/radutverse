import "./global.css";

import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all pages for better code-splitting
const Index = lazy(() => import("./pages/Index"));
const IpfiAssistant = lazy(() => import("./pages/IpfiAssistant"));
const NftMarketplace = lazy(() => import("./pages/NftMarketplace"));
const MyPortfolio = lazy(() => import("./pages/MyPortfolio"));
const Settings = lazy(() => import("./pages/Settings"));
const History = lazy(() => import("./pages/History"));
const IpImagine = lazy(() => import("./pages/IpImagine"));
const CreationResult = lazy(() => import("./pages/CreationResult"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-screen bg-background">
    <div className="text-center">
      <div className="mb-4 animate-spin">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

declare global {
  interface Window {
    __privyAnalyticsFetchPatched?: boolean;
  }
}

const ensurePrivyAnalyticsFetchPatched = () => {
  if (typeof window === "undefined") return;
  if (window.__privyAnalyticsFetchPatched) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error) {
      const input = args[0];
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : undefined;
      if (url && url.includes("edge.fullstory.com")) {
        return new Response(null, {
          status: 204,
          statusText: "No Content",
        });
      }
      throw error;
    }
  };
  window.__privyAnalyticsFetchPatched = true;
};

const queryClient = new QueryClient();
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/ipfi-assistant" element={<IpfiAssistant />} />
        <Route path="/ip-imagine" element={<IpImagine />} />
        <Route path="/creation-result" element={<CreationResult />} />
        <Route path="/nft-marketplace" element={<NftMarketplace />} />
        <Route path="/my-portfolio" element={<MyPortfolio />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

const App = () => {
  ensurePrivyAnalyticsFetchPatched();

  const appContent = (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );

  if (!privyAppId) {
    return appContent;
  }

  return <PrivyProvider appId={privyAppId}>{appContent}</PrivyProvider>;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
