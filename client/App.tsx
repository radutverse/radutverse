import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreationProvider } from "@/context/CreationContext";
import { NavigationProvider, useNavigation } from "@/context/NavigationContext";
import Index from "./pages/Index";
import IpfiAssistant from "./pages/IpfiAssistant";
import NftMarketplace from "./pages/NftMarketplace";
import MyPortfolio from "./pages/MyPortfolio";
import Settings from "./pages/Settings";
import History from "./pages/History";
import IpImagine from "./pages/IpImagine";
import IpImagineCreationResult from "./pages/IpImagineCreationResult";
import CreationResult from "./pages/CreationResult";

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

const AppRoutes = () => {
  const { currentPage } = useNavigation();

  const renderPage = () => {
    switch (currentPage) {
      case "index":
        return <Index />;
      case "ipfi-assistant":
        return <IpfiAssistant />;
      case "ip-imagine":
        return <IpImagine />;
      case "ip-imagine-result":
        return <IpImagineCreationResult />;
      case "creation-result":
        return <CreationResult />;
      case "nft-marketplace":
        return <NftMarketplace />;
      case "my-portfolio":
        return <MyPortfolio />;
      case "settings":
        return <Settings />;
      case "history":
        return <History />;
      default:
        return <Index />;
    }
  };

  return renderPage();
};

const App = () => {
  ensurePrivyAnalyticsFetchPatched();

  const appContent = (
    <NavigationProvider>
      <CreationProvider>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </CreationProvider>
    </NavigationProvider>
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
