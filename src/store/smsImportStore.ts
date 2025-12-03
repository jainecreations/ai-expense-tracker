import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SmsPending = {
	id: string;
	raw_text: string;
	amount: number;
	title?: string;
	bank?: string;
	date: string;
	status: 'pending' | 'added' | 'ignored';
	category_suggested?: string;
};

type SmsImportState = {
	pending: SmsPending[];
	load: () => Promise<void>;
	addPending: (p: Partial<SmsPending> & { raw_text: string; amount: number; date?: string }) => Promise<SmsPending>;
	markAdded: (id: string) => Promise<void>;
	markIgnored: (id: string) => Promise<void>;
	clearAll: () => Promise<void>;
};

const STORAGE_KEY = 'sms:pending';

const useSmsImportStore = create<SmsImportState>((set, get) => ({
	pending: [],
	load: async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const arr = raw ? JSON.parse(raw) : [];
			set({ pending: Array.isArray(arr) ? arr : [] });
		} catch (e) {
			console.warn('smsImportStore: load failed', e);
			set({ pending: [] });
		}
	},
	addPending: async (p) => {
		const id = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const item: SmsPending = {
			id,
			raw_text: p.raw_text,
			amount: Number(p.amount || 0),
			title: p.title,
			bank: p.bank,
			date: p.date || new Date().toISOString(),
			status: 'pending',
			category_suggested: p.category_suggested,
		};
		const next = [item, ...get().pending];
		set({ pending: next as SmsPending[] });
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch (e) {
			console.warn('smsImportStore: persist failed', e);
		}
		return item;
	},
	markAdded: async (id) => {
		const next = get().pending.map((p) => (p.id === id ? { ...p, status: 'added' } : p));
		set({ pending: next as SmsPending[] });
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch (e) {
			console.warn('smsImportStore: persist failed', e);
		}
	},
	markIgnored: async (id) => {
		const next = get().pending.map((p) => (p.id === id ? { ...p, status: 'ignored' } : p));
		set({ pending: next as SmsPending[] });
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch (e) {
			console.warn('smsImportStore: persist failed', e);
		}
	},
	clearAll: async () => {
		set({ pending: [] });
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
		} catch (e) {
			console.warn('smsImportStore: clear failed', e);
		}
	},
}));

// auto-load when module is imported so UI shows pending items
useSmsImportStore.getState().load();

export default useSmsImportStore;
