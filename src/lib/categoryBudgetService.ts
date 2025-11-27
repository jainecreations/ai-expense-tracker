import { supabase } from './supabase';

export type CategoryBudgetRecord = {
  id?: string;
  user_id: string;
  month: string; // YYYY-MM
  category: string;
  amount: number;
};

export const getCategoryBudgetsForMonth = async (userId: string, month: string) => {
  const { data, error } = await supabase
    .from('category_budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month);
  if (error) throw error;
  return (data || []) as CategoryBudgetRecord[];
};

export const upsertCategoryBudgetForMonth = async (userId: string, month: string, category: string, amount: number) => {
  // see if exists
  const { data: existing, error: fetchErr } = await supabase
    .from('category_budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('category', category)
    .limit(1);
  if (fetchErr) throw fetchErr;
  if (existing && existing.length > 0) {
    const id = existing[0].id;
    const { data, error } = await supabase.from('category_budgets').update({ amount }).eq('id', id).select();
    if (error) throw error;
    return data && data[0] ? (data[0] as CategoryBudgetRecord) : null;
  } else {
    const { data, error } = await supabase.from('category_budgets').insert([{ user_id: userId, month, category, amount }]).select();
    if (error) throw error;
    return data && data[0] ? (data[0] as CategoryBudgetRecord) : null;
  }
};
