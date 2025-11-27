import { create } from 'zustand';
import { getCategoryBudgetsForMonth, upsertCategoryBudgetForMonth } from '@/lib/categoryBudgetService';
import { useAuthStore } from './authStore';

type CategoryBudgets = Record<string, number | null>;

type CategoryBudgetState = {
  budgets: CategoryBudgets;
  month: string | null;
  loading: boolean;
  loadCategoryBudgets: (month?: string) => Promise<void>;
  setCategoryBudget: (category: string, amount: number, month?: string) => Promise<void>;
};

export const useCategoryBudgetStore = create<CategoryBudgetState>((set, get) => ({
  budgets: {},
  month: null,
  loading: false,
  loadCategoryBudgets: async (month) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        set({ budgets: {}, month: null });
        return;
      }
      const m = month || new Date().toISOString().slice(0, 7);
      const rows = await getCategoryBudgetsForMonth(user.id, m);
      const map: CategoryBudgets = {};
      rows.forEach((r) => (map[r.category] = r.amount));
      set({ budgets: map, month: m });
    } finally {
      set({ loading: false });
    }
  },
  setCategoryBudget: async (category, amount, month) => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) throw new Error('Not authenticated');
      const m = month || new Date().toISOString().slice(0, 7);
      await upsertCategoryBudgetForMonth(user.id, m, category, amount);
      set((state) => ({ budgets: { ...state.budgets, [category]: amount }, month: m }));
    } finally {
      set({ loading: false });
    }
  },
}));
