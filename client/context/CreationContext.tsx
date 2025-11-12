import React, { createContext, useState, ReactNode, useEffect } from "react";
import React, { createContext, useEffect, useState, ReactNode } from "react";
import { ResultType } from "@/types/generation";

export interface Creation {
  id: string;
  url: string;
  type: ResultType | null;
  timestamp: number;
  // optional status: 'pending' while generation is in progress, 'done' when finished
  status?: "pending" | "done";
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
  // Add a pending placeholder and return its id
  addPendingCreation: () => string;
  // Finalize a pending placeholder
  finalizeCreation: (id: string, url: string, type: ResultType) => void;
  removeCreation: (id: string) => void;
  clearCreations: () => void;
  // Generation progress percentage (0-100)
  progress: number;
  setProgress: (value: number) => void;
}

export const CreationContext = createContext<CreationContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "creation_history";

export const CreationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [progress, setProgress] = useState<number>(0);

  // Load creations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCreations(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to load creation history:", err);
      }
    }
  }, []);

  // Save creations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
  }, [creations]);

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
      status: "done",
      timestamp: Date.now(),
    };
    setCreations((prev) => [newCreation, ...prev]);
  };

  // Add a pending creation placeholder and return its id so it can be finalized later
  const addPendingCreation = (): string => {
    const id = `creation_pending_${Date.now()}`;
    const pending: Creation = {
      id,
      url: "",
      type: null,
      status: "pending",
      timestamp: Date.now(),
    };
    setCreations((prev) => [pending, ...prev]);
    return id;
  };

  // Finalize an existing pending creation by id (replace URL, type and mark done)
  const finalizeCreation = (id: string, url: string, type: ResultType) => {
    setCreations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, url, type, status: "done", timestamp: Date.now() }
          : c,
      ),
    );
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
    addPendingCreation,
    finalizeCreation,
    removeCreation,
    clearCreations,
    progress,
    setProgress,
  };

  return (
    <CreationContext.Provider value={contextValue}>
      {children}
    </CreationContext.Provider>
  );
};
