"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreationProvider } from "@/context/CreationContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  return (
    <PrivyProvider appId={privyAppId}>
      <QueryClientProvider client={queryClient}>
        <CreationProvider>{children}</CreationProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
