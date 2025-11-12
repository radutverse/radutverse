import React, { createContext, useState, ReactNode } from "react";

export type PageType =
  | "index"
  | "ipfi-assistant"
  | "ip-imagine"
  | "ip-imagine-result"
  | "creation-result"
  | "nft-marketplace"
  | "my-portfolio"
  | "settings"
  | "history";

interface NavigationContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

export const NavigationContext = createContext<
  NavigationContextType | undefined
>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<PageType>("index");

  const contextValue: NavigationContextType = {
    currentPage,
    setCurrentPage,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
