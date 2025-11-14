import React, { createContext, useState, ReactNode, useEffect } from "react";
import { ResultType } from "@/types/generation";

export interface Creation {
  id: string;
  url: string;
  type: ResultType;
  timestamp: number;
}

interface CreationContextType {
  resultUrl: string | null;
  setResultUrl: (url: string | null) => void;
  resultType: ResultType;
  setResultType: (type: ResultType) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  creations: Creation[];
  addCreation: (url: string, type: ResultType) => void;
  removeCreation: (id: string) => void;
  clearCreations: () => void;
}

export const CreationContext = createContext<CreationContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "creation_history";
const RESULT_URL_KEY = "current_result_url";
const RESULT_TYPE_KEY = "current_result_type";

export const CreationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);

  // Load creations and current result from localStorage on mount
  useEffect(() => {
    const storedCreations = localStorage.getItem(STORAGE_KEY);
    if (storedCreations) {
      try {
        setCreations(JSON.parse(storedCreations));
      } catch (err) {
        console.error("Failed to load creation history:", err);
      }
    }

    const storedResultUrl = localStorage.getItem(RESULT_URL_KEY);
    const storedResultType = localStorage.getItem(RESULT_TYPE_KEY);
    if (storedResultUrl) {
      setResultUrl(storedResultUrl);
    }
    if (storedResultType) {
      setResultType(storedResultType as ResultType);
    }
  }, []);

  // Save creations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
  }, [creations]);

  // Save current result URL to localStorage
  useEffect(() => {
    if (resultUrl) {
      localStorage.setItem(RESULT_URL_KEY, resultUrl);
    } else {
      localStorage.removeItem(RESULT_URL_KEY);
    }
  }, [resultUrl]);

  // Save current result type to localStorage
  useEffect(() => {
    if (resultType) {
      localStorage.setItem(RESULT_TYPE_KEY, resultType);
    } else {
      localStorage.removeItem(RESULT_TYPE_KEY);
    }
  }, [resultType]);

  useEffect(() => {
    return () => {
      if (resultUrl && resultUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const addCreation = (url: string, type: ResultType) => {
    const newCreation: Creation = {
      id: `creation_${Date.now()}`,
      url,
      type,
      timestamp: Date.now(),
    };
    setCreations((prev) => [newCreation, ...prev]);
  };

  const removeCreation = (id: string) => {
    setCreations((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCreations = () => {
    setCreations([]);
  };

  const contextValue: CreationContextType = {
    resultUrl,
    setResultUrl,
    resultType,
    setResultType,
    isLoading,
    setIsLoading,
    loadingMessage,
    setLoadingMessage,
    error,
    setError,
    creations,
    addCreation,
    removeCreation,
    clearCreations,
  };

  return (
    <CreationContext.Provider value={contextValue}>
      {children}
    </CreationContext.Provider>
  );
};
