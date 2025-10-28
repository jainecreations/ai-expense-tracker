import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://zflydzgucatmxnagubzv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbHlkemd1Y2F0bXhuYWd1Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODk2MDAsImV4cCI6MjA3Njk2NTYwMH0.HkA6rVFjjTLn9SGGSbLcnZQRRcKLfyfTs_HnJWWzceM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
