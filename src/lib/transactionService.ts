// src/lib/transactionService.ts
import { supabase } from "./supabase";

export type TransactionInput = {
  name: string;
  amount: number;
  date: string;
  category: string;
  user_id?: string; // optional user id to associate transaction with a user
  id?: string;
  // AI suggestions
  // ai_category?: string | null;
  // ai_confidence?: number | null;
  // ai_applied?: boolean | null;
  // // source of transaction
  // source?: 'manual' | 'sms' | 'receipt' | 'recurring' | 'import' | string;
};

export const addTransactionToSupabase = async (transaction: TransactionInput) => {
  const { data, error } = await supabase.from("transactions").insert([transaction]).select();
  if (error) throw error;
  // return the inserted row(s)
  return data;
};

export const fetchTransactionsFromSupabase = async (userId?: string) => {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const deleteTransactionFromSupabase = async (id: string) => {
  const { data, error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
  return data;
};

export const updateTransactionInSupabase = async (id: string, updates: Partial<TransactionInput>) => {
  const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select();
  if (error) throw error;
  return data;
};