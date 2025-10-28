// src/store/types.ts
export type Transaction = {
  id: string;
  name: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string; // link to a Category
};
