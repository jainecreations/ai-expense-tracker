import { supabase } from './supabase';
import { addTransactionToSupabase } from './transactionService';
import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns';

export type Frequency = 'daily' | 'weekly' | 'monthly';

export type RecurringExpense = {
  id?: string;
  user_id?: string;
  name: string;
  amount: number;
  category: string;
  frequency: Frequency;
  start_date: string; // yyyy-MM-dd
  next_date: string; // yyyy-MM-dd
  last_generated_at?: string | null; // iso
  active?: boolean;
  skipped?: boolean;
};

function computeNextDate(fromDate: string, freq: Frequency) {
  const d = parseISO(fromDate);
  let next;
  if (freq === 'daily') next = addDays(d, 1);
  else if (freq === 'weekly') next = addWeeks(d, 1);
  else next = addMonths(d, 1);
  return format(next, 'yyyy-MM-dd');
}

export const fetchRecurringForUser = async (userId?: string) => {
  let q = supabase.from('recurring_expenses').select('*').order('start_date', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data as RecurringExpense[];
};

export const addRecurringToSupabase = async (rec: RecurringExpense) => {
  const { data, error } = await supabase.from('recurring_expenses').insert([rec]).select();
  if (error) throw error;
  return (data as RecurringExpense[])[0];
};

export const updateRecurringInSupabase = async (id: string, updates: Partial<RecurringExpense>) => {
  const { data, error } = await supabase.from('recurring_expenses').update(updates).eq('id', id).select();
  if (error) throw error;
  return (data as RecurringExpense[])[0];
};

export const deleteRecurringFromSupabase = async (id: string) => {
  const { data, error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;
  return data;
};

// Generate a transaction now for the given recurring id and advance next_date
export const generateRecurringNow = async (rec: RecurringExpense) => {
  const nowIso = new Date().toISOString();
  // create transaction
  const tx = {
    name: rec.name,
    amount: rec.amount,
    date: nowIso,
    category: rec.category,
    user_id: rec.user_id,
  };
  const inserted = await addTransactionToSupabase(tx as any);
  const created = Array.isArray(inserted) ? inserted[0] : inserted;

  // compute next date
  const newNext = computeNextDate(rec.next_date || rec.start_date, rec.frequency);

  const updated = await updateRecurringInSupabase(rec.id as string, {
    last_generated_at: nowIso,
    next_date: newNext,
    skipped: false,
  });

  return { transaction: created, recurring: updated };
};
