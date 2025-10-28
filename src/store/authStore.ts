import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setUser: (user: any) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: false,
    setLoading: (loading) => set({ loading }),
    setUser: (user) => set({ user }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    },
}));
