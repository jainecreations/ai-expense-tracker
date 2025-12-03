// src/store/types.ts
export type Transaction = {
  id: string;
  name: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string; // link to a Category
};

export type SmsImport = {
  id: string;
  raw_text: string;
  amount?: number | null;
  title?: string | null;
  category_suggested?: string | null;
  bank?: string | null;
  date?: string | null; // ISO string
  status: 'pending' | 'added' | 'ignored';
};
