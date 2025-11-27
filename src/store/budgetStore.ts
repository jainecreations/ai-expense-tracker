import { create } from 'zustand';
import { getBudgetForMonth, upsertBudgetForMonth } from '@/lib/budgetService';
import { useAuthStore } from './authStore';

type BudgetState = {
  amount: number | null;
  month: string | null; // YYYY-MM
  loading: boolean;
  loadBudget: (month?: string) => Promise<void>;
  setBudget: (amount: number, month?: string) => Promise<void>;
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  amount: null,
  month: null,
  loading: false,
  loadBudget: async (month) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        set({ amount: null, month: null });
        return;
      }
      const now = month || new Date().toISOString().slice(0, 7);
      const rec = await getBudgetForMonth(user.id, now);
      set({ amount: rec ? rec.amount : null, month: now });
    } finally {
      set({ loading: false });
    }
  },
  setBudget: async (amount, month) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) throw new Error('Not authenticated');
      const m = month || new Date().toISOString().slice(0, 7);
      const rec = await upsertBudgetForMonth(user.id, m, amount);
      set({ amount: rec ? rec.amount : amount, month: m });
    } finally {
      set({ loading: false });
    }
  },
}));
