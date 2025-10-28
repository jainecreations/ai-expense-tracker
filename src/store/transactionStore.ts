import { create } from "zustand";
import { TransactionInput, addTransactionToSupabase, deleteTransactionFromSupabase, fetchTransactionsFromSupabase } from "../lib/transactionService";
import { useAuthStore } from "@/store/authStore";

type Transaction = TransactionInput & { id?: string };

interface TransactionStore {
    transactions: Transaction[];
    isLoading: boolean;
    isSaving: boolean;
    deletingIds: string[];
    addTransaction: (transaction: TransactionInput) => Promise<void>;
    loadTransactions: () => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
    transactions: [],
    isLoading: false,
    isSaving: false,
    deletingIds: [],
    addTransaction: async (transaction) => {
        set({ isSaving: true });
        try {
            const inserted = await addTransactionToSupabase(transaction);
            // supabase returns inserted rows; take the first one
            const newItem = Array.isArray(inserted) ? inserted[0] : inserted;
            set((state) => ({ transactions: [newItem, ...state.transactions] }));
        } finally {
            set({ isSaving: false });
        }
    },
    loadTransactions: async () => {
        set({ isLoading: true });
        try {
            // fetch only for current user
            const user = useAuthStore.getState().user;
            if (!user?.id) {
                set({ transactions: [] });
            } else {
                const data = await fetchTransactionsFromSupabase(user.id);
                set({ transactions: data || [] });
            }
        } finally {
            set({ isLoading: false });
        }
    },
    deleteTransaction: async (id: string) => {
        // mark as deleting
        set((state) => ({ deletingIds: [...state.deletingIds, id] }));
        try {
            await deleteTransactionFromSupabase(id);
            set((state) => ({
                transactions: state.transactions.filter((t) => t.id !== id),
            }));
        } finally {
            // remove id from deletingIds
            set((state) => ({ deletingIds: state.deletingIds.filter((d) => d !== id) }));
        }
    }

}));
