import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "naturagloss_compare";

export type CompareType = "product" | "bundle";

export interface CompareEntry {
  id: string;
  type: CompareType;
}

type CompareState = CompareEntry[];

type CompareAction =
  | { type: "hydrate"; payload: CompareState }
  | { type: "toggle"; payload: CompareEntry }
  | { type: "clear" };

const compareReducer = (state: CompareState, action: CompareAction): CompareState => {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "toggle": {
      const exists = state.some(
        (entry) => entry.id === action.payload.id && entry.type === action.payload.type
      );
      if (exists) {
        return state.filter(
          (entry) => !(entry.id === action.payload.id && entry.type === action.payload.type)
        );
      }
      return [...state, action.payload];
    }
    case "clear":
      return [];
    default:
      return state;
  }
};

interface CompareContextValue {
  compared: CompareState;
  listCompared: () => CompareState;
  isInCompare: (id: string, type: CompareType) => boolean;
  toggleCompare: (entry: CompareEntry) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(compareReducer, [], () => {
    if (typeof window === "undefined") return [];
    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const value = useMemo<CompareContextValue>(
    () => ({
      compared: state,
      listCompared: () => state,
      isInCompare: (id, type) => state.some((entry) => entry.id === id && entry.type === type),
      toggleCompare: (entry) => dispatch({ type: "toggle", payload: entry }),
      clearCompare: () => dispatch({ type: "clear" }),
    }),
    [state]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
