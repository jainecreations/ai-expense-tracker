import { supabase } from './supabase';

export type BudgetRecord = {
  id?: string;
  user_id: string;
  month: string; // YYYY-MM
  amount: number;
};

export const getBudgetForMonth = async (userId: string, month: string) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .limit(1);
  if (error) throw error;
  return data && data[0] ? (data[0] as BudgetRecord) : null;
};

export const upsertBudgetForMonth = async (userId: string, month: string, amount: number) => {
  // try update first
  const { data: existing, error: fetchErr } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .limit(1);
  if (fetchErr) throw fetchErr;
  if (existing && existing.length > 0) {
    const id = existing[0].id;
    const { data, error } = await supabase.from('budgets').update({ amount }).eq('id', id).select();
    if (error) throw error;
    return data && data[0] ? (data[0] as BudgetRecord) : null;
  } else {
    const { data, error } = await supabase.from('budgets').insert([{ user_id: userId, month, amount }]).select();
    if (error) throw error;
    return data && data[0] ? (data[0] as BudgetRecord) : null;
  }
};
