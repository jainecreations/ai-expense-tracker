import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Appearance = "system" | "light" | "dark";

const APPEARANCE_KEY = "settings:appearance";

interface ThemeState {
  appearance: Appearance;
  setAppearance: (a: Appearance) => Promise<void>;
  loadAppearance: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  appearance: "system",
  setAppearance: async (a: Appearance) => {
    set({ appearance: a });
    try {
      await AsyncStorage.setItem(APPEARANCE_KEY, a);
    } catch (err) {
      console.warn("Failed to persist appearance", err);
    }
  },
  loadAppearance: async () => {
    try {
      const a = await AsyncStorage.getItem(APPEARANCE_KEY);
      if (a === "light" || a === "dark" || a === "system") {
        set({ appearance: a as Appearance });
      }
    } catch (err) {
      console.warn("Failed to load persisted appearance", err);
    }
  },
}));

export type { Appearance };
