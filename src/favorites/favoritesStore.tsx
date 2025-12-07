import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "naturagloss_favorites";

export type FavoriteType = "product" | "bundle";

export interface FavoriteEntry {
  id: string;
  type: FavoriteType;
}

type FavoritesState = FavoriteEntry[];

type FavoritesAction =
  | { type: "hydrate"; payload: FavoritesState }
  | { type: "toggle"; payload: FavoriteEntry };

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
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
    default:
      return state;
  }
};

interface FavoritesContextValue {
  favorites: FavoritesState;
  listFavorites: () => FavoritesState;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  toggleFavorite: (entry: FavoriteEntry) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [state, dispatch] = useReducer(favoritesReducer, [], () => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore write errors
    }
  }, [state]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites: state,
      listFavorites: () => state,
      isFavorite: (id, type) => state.some((entry) => entry.id === id && entry.type === type),
      toggleFavorite: (entry: FavoriteEntry) => dispatch({ type: "toggle", payload: entry }),
    }),
    [state]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
