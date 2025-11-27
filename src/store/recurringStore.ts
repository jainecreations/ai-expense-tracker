import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { fetchRecurringForUser, addRecurringToSupabase, deleteRecurringFromSupabase, generateRecurringNow, RecurringExpense } from '@/lib/recurringService';
import { useTransactionStore } from './transactionStore';

interface RecurringState {
  recurring: RecurringExpense[];
  isLoading: boolean;
  loadRecurring: () => Promise<void>;
  addRecurring: (r: Omit<RecurringExpense, 'id' | 'last_generated_at' | 'skipped'>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  generateNow: (id: string) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurring: [],
  isLoading: false,
  loadRecurring: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) { set({ recurring: [] }); return; }
      const data = await fetchRecurringForUser(user.id);
      set({ recurring: data || [] });
    } finally { set({ isLoading: false }); }
  },
  addRecurring: async (r) => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) throw new Error('Not authenticated');
      const record = await addRecurringToSupabase({ ...r, user_id: user.id, active: true });
      set((s) => ({ recurring: [record, ...s.recurring] }));
    } finally { set({ isLoading: false }); }
  },
  deleteRecurring: async (id) => {
    set({ isLoading: true });
    try {
      await deleteRecurringFromSupabase(id);
      set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) }));
    } finally { set({ isLoading: false }); }
  },
  generateNow: async (id) => {
    set({ isLoading: true });
    try {
      const rec = get().recurring.find((r) => r.id === id);
      if (!rec) throw new Error('Recurring not found');
      const { transaction, recurring } = await generateRecurringNow(rec as RecurringExpense);
      // update transaction list locally
      useTransactionStore.setState((s: any) => ({ transactions: [transaction, ...s.transactions] }));
      // update recurring entry
      set((s) => ({ recurring: s.recurring.map((r) => (r.id === recurring.id ? recurring : r)) }));
    } finally { set({ isLoading: false }); }
  },
}));

export type { RecurringExpense };
