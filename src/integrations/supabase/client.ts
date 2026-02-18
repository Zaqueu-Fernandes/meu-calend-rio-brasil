import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mojasnovcwxulhxhgyqs.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vamFzbm92Y3d4dWxoeGhneXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcyNzcsImV4cCI6MjA4NjU1MzI3N30.RjJBKA_IcO-2XdRzJqP5xD4HNvmdNsEbCjnT_PW9kLg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});