import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ONBOARDING_STORAGE_KEY = "onBoarding";

interface OnBoardingState {
  isOnBoarding: boolean | null;
  setIsOnBoarding: (isOnBoarding: boolean) => void;
}

export const useOnBoardingState = create<OnBoardingState>()(
  persist(
    (set) => ({
      isOnBoarding: null as boolean | null,
      setIsOnBoarding: (isOnBoarding: boolean) => set({ isOnBoarding }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      })),
    }
  )
);

export const SEARCH_HISTORY_STORAGE_KEY = "searchHistory";

interface SearchHistoryState {
  history: string[];
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addToHistory: (query: string) =>
        set((state) => {
          if (!query.trim()) return state;
          const filtered = state.history.filter((h) => h !== query);
          return { history: [query, ...filtered].slice(0, 10) }; // Keep last 10
        }),
      removeFromHistory: (query: string) =>
        set((state) => ({
          history: state.history.filter((h) => h !== query),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: SEARCH_HISTORY_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      })),
    }
  )
);

export const FAVORITES_STORAGE_KEY = "favorites";

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (movieId: string) => void;
  isFavorite: (movieId: string) => boolean;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (movieId: string) =>
        set((state) => {
          const isFav = state.favorites.includes(movieId);
          if (isFav) {
            return { favorites: state.favorites.filter((f) => f !== movieId) };
          } else {
            return { favorites: [...state.favorites, movieId] };
          }
        }),
      isFavorite: (movieId: string) => get().favorites.includes(movieId),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      })),
    }
  )
);
