import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENCY_KEY = "settings:currency";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | string;

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => Promise<void>;
  loadCurrency: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // default to INR to preserve old behaviour
  currency: "INR",
  setCurrency: async (c: CurrencyCode) => {
    set({ currency: c });
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, c);
    } catch (err) {
      console.warn("Failed to persist currency", err);
    }
  },
  loadCurrency: async () => {
    try {
      const c = await AsyncStorage.getItem(CURRENCY_KEY);
      if (c) set({ currency: c });
    } catch (err) {
      console.warn("Failed to load persisted currency", err);
    }
  },
}));

export default useCurrencyStore;
