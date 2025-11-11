import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreationProvider } from "@/context/CreationContext";
import Index from "./pages/Index";
import IpfiAssistant from "./pages/IpfiAssistant";
import NftMarketplace from "./pages/NftMarketplace";
import MyPortfolio from "./pages/MyPortfolio";
import Settings from "./pages/Settings";
import History from "./pages/History";
import IpImagine from "./pages/IpImagine";
import CreationResult from "./pages/CreationResult";
import NotFound from "./pages/NotFound";

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
  </BrowserRouter>
);

const App = () => {
  ensurePrivyAnalyticsFetchPatched();

  const appContent = (
    <CreationProvider>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </CreationProvider>
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
