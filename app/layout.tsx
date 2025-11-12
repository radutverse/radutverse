import type { Metadata } from "next";
import { PrivyProvider } from "@privy-io/react-auth";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fusion",
  description: "A production-ready full-stack React application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {privyAppId ? (
          <PrivyProvider appId={privyAppId}>
            <Providers>{children}</Providers>
          </PrivyProvider>
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
